#! /usr/bin/env node --harmony
const inquirer = require('inquirer')
const program = require('commander')
const sfs = require('../src/swizzle-fs')
const sc = require('../src/swizzle-config')
const snakeCase = require('lodash.snakecase')

const rc = sfs.loadRcConfig({rcFiles: ['.swizzlerc']})
const conf = new sc.SwizzleConfig(sfs.loadSwizzleConfig({file: './swizzle.json', rc}))

// todo externalize actions so we can test them independently of the commander / inquirer
// todo remove-param notifies which code files use this param

console.log(process.cwd())

program
	.version('0.0.1')

program
	.command('add-param')
	.alias('ap')
	.description('add a parameter to swizzle config')
	.option('-n, --name <name>', 'name of parameter')
	.option('-d, --desc <desc>', 'description of parameter')
	.option('-v, --default-value <defaultValue>', 'default value of parameter')
	.action((options) => {

		console.log(`add-param --name '%s' --desc %s --default-value %s`, options.name, options.desc, options.defaultValue)

		const param = {
			name: options.name,
			desc: options.desc,
			defaultValue: options.defaultValue
		}

		conf.addParam(param)
		sfs.saveSwizzleConfig({file: './swizzle.json', conf: conf.state})

		console.log('be sure to update your code files to seed this param where it is needed.')
		console.log(samples())

	})


program
	.command('remove-param')
	.alias('rp')
	.description('remove a parameter from swizzle config')
	.option('-n, --name <name>', 'name of parameter')
	.action((options) => {

		console.log(`remove-param --name '%s'`, options.name)

		// todo notify which code files use this param

		const param = {
			name: options.name
		}

		const removeParam = conf.state.params.find((p) => p.name === param.name)

		if (!removeParam) {
			console.log('param name is not found in swizzle config', param.name)
			return
		}

		console.log('be sure to remove this param from any code files to minimize errors.')
		console.log(samples(param.name))

		conf.removeParam(param)
		sfs.saveSwizzleConfig({file: './swizzle.json', conf: conf.state})

	})

program
	.command('add-files [files...]')
	.alias('af')
	.description('add code files to swizzle config')
	.action((files) => {

		console.log('add-files %s', files)

		conf.addFiles({files})
		sfs.saveSwizzleConfig({file: './swizzle.json', conf: conf.state})

		console.log('add the parameters needed in each code file:')
		console.log(samples())
		console.log('then run `swizzle stack <stack-name>` to enter parameters')
		console.log('and swizzle the configuration values in your code files.')

	})

program
	.command('remove-files [files...]')
	.alias('rf')
	.description('remove code files from swizzle config')
	.action((files) => {

		console.log('files %s', files)

		conf.removeFiles({files})
		sfs.saveSwizzleConfig({file: './swizzle.json', conf: conf.state})

	})

program
	.command('stack <name>')
	.alias('s')
	.description('swizzle code files, prompt for any missing parameters in the stack')
	.option('-e, --edit-first', 'review and edit stack parameter values before swizzling code files')
	.option('-s, --save-in-rc', 'save stack param values in the .swizzlerc file')
	.option('-f, --file <file>', 'save stack param values in the given file')
	.action((name, options) => {

		console.log('stack %s --edit-first %s --save-in-rc %s --file %s', name, !!options.editFirst, !!options.saveInRc, options.file)

		const edit = options.editFirst
		const save = options.saveInRc
		const file = options.file

		const params = conf.state.params
		const stack = conf.state.stacks[name] || {
			file: './swizzle.json',
			params: {}
		}

		if (save) {
			stack.file = '.swizzlerc'
		}

		if (file) {
			stack.file = file
		}

		const questions = params.reduce((list, param) => {
			const hasParam = !!stack.params[param.name]
			const askUser = edit || !hasParam
			if (askUser) {
				const name = param.name
				const message = `enter ${param.description}`
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
			conf.addStack({name, params: stack.params, file: stack.file})
			sfs.saveSwizzleConfig({conf: conf.state, file: './swizzle.json'})
			return stack.params
		}).then((params) => {
			sfs.swizzleSourceFiles({params, files: conf.state.files})
		}).catch((e) => console.error(e.message))

	})

program.parse(process.argv)

function getValue(param) {
	if (param.defaultValue) {
		return param.defaultValue
	}
	const value = param.description || param.name
	return snakeCase('Your_' + value).toUpperCase()
}

function samples(paramName) {
	const params = conf.state.params.filter((p) => paramName ? p.name === paramName : true).map((param) => {
		const value = getValue(param)
		return `\n\t\t"${param.name}": "${value}"`
	}).join(',')
	return `\t{${params}\n\t}`
}
