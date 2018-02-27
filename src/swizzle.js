require("babel-register")
const inquirer = require('inquirer')
const swizzleFileSystem = require('../src/file-system')
const sc = require('../src/config')

// todo remove-param notifies which code files use this param
// todo add input validations to the add-param command
// todo inject inquirer into class so we can test w/o prompting

function initializeConfig(sfs) {
	// only uses ~/.swizzlerc or ./.swizzlerc - no merging yet
	const rcFile = sfs.getRcFilePathsIfExists()
	const rc = rcFile ? sfs.loadRcConfig({rcFiles: [rcFile]}) : {}
	const swizzleFilePath = sfs.getSwizzleJsonFilePath()
	const conf = new sc.SwizzleConfig(sfs.loadSwizzleConfig({file: swizzleFilePath, rc}))
	return conf
}

class Swizzle {

	constructor(conf = null, sfs = swizzleFileSystem) {
		if (conf instanceof sc.SwizzleConfig) {
			this.conf = conf
		} else {
			this.conf = initializeConfig(sfs)
		}
		this.fs = sfs
	}

	get swizzleFilePath() {
		return this.conf.state.filePath
	}

	addParam = ({name, desc, defaultValue, generated}) => {
		const param = {name, desc, defaultValue, generated}
		this.conf.addParam(param)
		this.fs.saveSwizzleConfig({file: this.swizzleFilePath, conf: this.conf.state})
	}

	updateGeneratedParams = (generatedParams) => {

		if (!(generatedParams && Object.keys(generatedParams).length)) {
			return
		}

		const lastStack = this.conf.stackName

		const stack = this.conf.state.stacks[lastStack]
		let saveSwizzleConfig = false
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
		this.swizzleStack(lastStack, {})

	}

	removeParam = ({name}) => {
		// todo notify which code files use this param
		const param = {name}
		const removeParam = this.conf.state.params.find((p) => p.name === name)
		if (!removeParam) {
			console.log('param name is not found in swizzle config', name, this.swizzleFilePath)
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

		const lastStack = this.conf.stackName

		const prompts = [{
			name: 'name',
			message: 'enter stack name',
			default: lastStack || 'dev'
		}]

		inquirer.prompt(prompts)
			.then((answers) => {
				this.swizzleStack(answers.name, options)
			})
			.catch(console.error)
	}

	swizzleStackConfig = (options) => {

		const lastStack = this.conf.stackName

		const input = new Promise((resolve, reject) => {
			if (lastStack) {
				resolve(lastStack)
				return
			}
			const prompts = [{
				name: 'name',
				message: 'enter stack name',
				default: 'dev'
			}]

			inquirer.prompt(prompts)
				.then((answers) => {
					resolve(answers.name)
				})
				.catch(reject)

		})

		input.then((stackName) => this.swizzleStack(stackName, options)).catch(console.error)

	}

	swizzleStack = (name, {editFirst, useRc, file}) => {

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
			const hasParam = !!stack.params[param.name]
			const askUser = editFirst || !(hasParam || param.generated)
			if (askUser) {
				const name = param.name
				const message = `enter ${param.description}${param.generated ? ' <generated>' : ''}`
				const defaultValue = stack.params[name] ? stack.params[name] : param.defaultValue
				list.push({
					name,
					message,
					default: defaultValue
				})
			}
			return list
		}, [])

		const input = new Promise((resolve, reject) => {
			if (stack.params && Object.keys(stack.params).length)
				if (questions.length === 0) {
					return resolve(stack)
				}
			inquirer.prompt(questions)
				.then((answers) => {
					Object.assign(stack.params, answers)
					return stack
				})
				.then(resolve)
				.catch(reject)
		})

		input.then((stack) => {
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
		}).catch((e) => console.error(e))

	}

	clean = ({verbose}) => {
		const params = this.conf.listParams({verbose: true}).reduce((map, param) => {
			map[param.name] = param.defaultValue || ''
			return map
		}, {})
		this.fs.swizzleSourceFiles({params, files: this.conf.files})
		const file = this.conf.swizzleFilePath
		delete this.conf.state.stacks
		delete this.conf.state.stackName
		this.fs.saveSwizzleConfig({conf: this.conf.state, file})
		if (verbose) {
			console.log(params)
		}
	}

}

exports.Swizzle = Swizzle
