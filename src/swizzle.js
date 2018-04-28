import _inquirer from 'inquirer'
import {SwizzleConfig} from './swizzle-config'
import {swizzleFileSystem} from './swizzle-file-system'
import {validateUserInput} from './validateUserInput'

// todo changing stack should prompt for --no-save items again
// todo cli add-choices --name param --choices "a", "b", "c"
// todo cli add-validation --name param --message msg --regex "regex"
// todo remove-param notifies which code files use this param
// todo validate the JSON integrity of .json files we swizzle

export function initializeConfig(sfs) {
	// only uses ~/.swizzlerc or ./.swizzlerc - no merging yet
	const rcFile = sfs.getRcFilePathsIfExists()
	const rc = rcFile ? sfs.loadRcConfig({rcFiles: [rcFile]}) : {}
	const swizzleFilePath = sfs.getSwizzleJsonFilePath()
	console.log(swizzleFilePath)
	return new SwizzleConfig(sfs.loadSwizzleConfig({file: swizzleFilePath, rc}))
}

class Swizzle {

	constructor(conf = null, sfs = swizzleFileSystem, inquirer = _inquirer) {
		if (conf instanceof SwizzleConfig) {
			this.conf = conf
		} else {
			this.conf = initializeConfig(sfs)
		}
		this.fs = sfs
		this.inquirer = inquirer
	}

	addParam = ({name, desc, defaultValue, generated, password, noSave}) => {
		const param = {name, desc, defaultValue, generated, password, noSave}
		this.conf.addParam(param)
		this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
	}

	updateGeneratedParams = (generatedParams) => {

		if (!(generatedParams && Object.keys(generatedParams).length)) {
			return
		}

		let saveSwizzleConfig = false
		const lastStack = this.swizzleStackName
		const stack = this.conf.state.stacks[lastStack]

		Object.keys(generatedParams).forEach((name) => {
			const generated = true
			const existingParam = this.conf.state.params.find((p) => p.name === name)
			if (!existingParam) {
				saveSwizzleConfig = true
				this.conf.addParam({name, generated})
			}
		})

		if (saveSwizzleConfig) {
			this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
		}

		if (!stack) {
			// there is no stack to swizzle
			// todo determine which use cases would hit this and
			// what the right response should be....
			return
		}

		const params = {}

		Object.assign(params, stack.params, generatedParams)

		this.conf.addStack({name: lastStack, params, file: stack.file})

		// return the promise for catching errors in testing
		return this.swizzleStack(lastStack)

	}

	removeParam = ({name}) => {
		// todo notify which code files use this param
		const param = {name}
		const removeParam = this.conf.state.params.find((p) => p.name === name)
		if (!removeParam) {
			console.log('param name is not found in swizzle config', name, this.swizzleFilePath)
			return
		}
		this.conf.removeParam(param)
		this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
	}

	addFiles = ({files}) => {
		this.conf.addFiles({files})
		this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
	}

	removeFiles = ({files}) => {
		this.conf.removeFiles({files})
		this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
	}

	swizzleStackInit = (options) => {

		const confStackName = this.conf.stackName

		const prompts = [{
			name: 'stackName',
			message: 'enter stack name',
			default: confStackName || 'dev'
		}]

		return this.inquirer.prompt(prompts)
			.then((answers) => {
				this.swizzleStack(answers.stackName, options)
			})

	}

	swizzleStackConfig = (options) => {

		const confStackName = this.conf.stackName

		if (confStackName) {
			return this.swizzleStack(confStackName, options)
		}

		const prompts = [{
			name: 'stackName',
			message: 'enter stack name',
			default: 'dev'
		}]

		return this.inquirer.prompt(prompts)
			.then((answers) => {
				return answers.stackName
			})
			.then((stackName) => this.swizzleStack(stackName, options))

	}

	swizzleStack = (name, {editFirst, useRc, file} = {}) => {

		const params = this.conf.state.params
		const stack = this.conf.state.stacks[name] || {
			file: this.swizzleFilePath,
			params: {}
		}

		if (useRc) {
			stack.file = '.swizzlerc'
		}

		if (file) {
			stack.file = file
		}

		const questions = params.reduce((list, param) => {
			const name = param.name
			const hasParam = !!stack.params[name]
			const askUser = editFirst || (param.noSave && !hasParam) || !(hasParam || param.generated)
			if (askUser) {
				const message = `enter ${param.description}${param.generated ? ' <generated>' : ''}`
				const defaultValue = stack.params[name] ? stack.params[name] : param.defaultValue
				const question = {
					name,
					message,
					default: defaultValue
				}
				if (param.choices instanceof Array) {
					question.type = 'list'
					question.choices = param.choices
				}
				if (param.regex) {
					question.validate = validateUserInput(param.regex)
				}
				if (param.password) {
					question.type = 'password'
				}
				if (param.noSave) {
					question.default = param.defaultValue
				}
				list.push(question)
			}
			return list
		}, [])

		const input = new Promise((resolve, reject) => {
			if (stack.params && Object.keys(stack.params).length) {
				if (questions.length === 0) {
					return resolve(stack)
				}
			}
			this.inquirer.prompt(questions)
				.then((answers) => {
					Object.assign(stack.params, answers)
					return stack
				})
				.then(resolve)
				.catch(reject)
		})

		// return the promise for catching errors in testing
		return input.then((stack) => {
			this.conf.addStack({name, params: stack.params, file: stack.file})
			this.conf.stackName = name
			this.fs.saveSwizzleConfig({conf: this.conf.state, file: this.swizzleFilePath})
			return stack.params
		}).then((params) => {
			if (this.conf.files.length === 0) {
				console.log('nothing to swizzle: no files specified in swizzle.json')
				return
			}
			this.fs.swizzleSourceFiles({params, files: this.conf.files})
		})

	}

	clean = ({verbose} = {verbose: false}) => {
		const params = this.conf.listParams({verbose: true}).reduce((map, param) => {
			map[param.name] = param.defaultValue
			return map
		}, {})
		this.fs.swizzleSourceFiles({params, files: this.conf.files})
		const file = this.conf.swizzleFilePath
		delete this.conf.state.stacks
		delete this.conf.state.stackName
		this.fs.saveSwizzleConfig({conf: this.conf.state, file})
		if (verbose) {
			console.log('cleaned following params: ', params)
		}
	}

	get swizzleFilePath() {
		return this.conf.state.filePath
	}

	get swizzleStackName() {
		return this.conf.stackName
	}

	get stack() {
		if (!this.swizzleStackName) {
			console.log('no stack name set. try running "swizzle init" first.')
		}
		const stack = this.conf.stacks[this.swizzleStackName] || {}
		return stack.params || {}
	}
}

exports.Swizzle = Swizzle
