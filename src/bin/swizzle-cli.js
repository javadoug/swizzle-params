#! /usr/bin/env node --harmony
import program from 'commander'
import {sfs} from '../file-system'
import {SwizzleConfig} from '../config'
import {Swizzle} from '../swizzle'
import snakeCase from 'lodash.snakecase'

// only uses ~/.swizzlerc or ./.swizzlerc
const rc = sfs.loadRcConfig({rcFiles: sfs.getRcFilePathsIfExists()})
const conf = new SwizzleConfig(sfs.loadSwizzleConfig({file: './swizzle.json', rc}))
const swizzle = new Swizzle(conf, sfs)

program
	.version('0.0.1')

program
	.command('add-param')
	.alias('ap')
	.description('add a parameter to swizzle.json')
	.option('-g, --generated', 'generated parameter so do not prompt user')
	.option('-n, --name <name>', 'name of parameter to add')
	.option('-d, --desc <desc>', 'description of parameter')
	.option('-v, --default-value <defaultValue>', 'default value of parameter')
	.action((options) => {

		console.log(`add-param %s--name '%s' --desc %s --default-value %s`,
			options.generated ? '-g ' : '',
			options.name,
			options.desc,
			options.defaultValue)

		const param = {
			name: options.name,
			desc: options.desc,
			defaultValue: options.defaultValue
		}

		if (options.generated) {
			param.generated = true
		}

		swizzle.addParam(param)

		console.log(samples())

	})


program
	.command('remove-param')
	.alias('rp')
	.description('remove a parameter from swizzle.json')
	.option('-n, --name <name>', 'name of parameter to remove')
	.action((options) => {

		console.log(`remove-param --name '%s'`, options.name)

		// todo notify which code files use this param

		const param = {
			name: options.name
		}

		const removeParam = conf.state.params.find((p) => p.name === param.name)

		if (!removeParam) {
			console.log('param name is not found in swizzle.json', param.name)
			return
		}

		console.log('be sure to remove this param from any code files to minimize errors.')
		console.log(samples(param.name))

		swizzle.removeParam(param)

	})

program
	.command('add-files [files...]')
	.alias('af')
	.description('add code files to swizzle.json')
	.action((files) => {

		console.log('add-files %s', files)

		swizzle.addFiles({files})

		console.log('add the parameters needed in each code file:')
		console.log(samples())
		console.log('then run `swizzle stack <stack-name>` to enter parameters')
		console.log('and swizzle the configuration values in your code files.')

	})

program
	.command('remove-files [files...]')
	.alias('rf')
	.description('remove code files from swizzle.json')
	.action((files) => {

		console.log('files %s', files)

		if (typeof files === 'string') {
			files = [files]
		}

		swizzle.removeFiles({files})

	})

program
	.command('init', {isDefault: true})
	.alias('i')
	.description('prompt for stack name, prompt for missing parameters, swizzle code files')
	.option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files')
	.option('-s, --use-rc', 'save stack param values in the .swizzlerc file')
	.option('-f, --file <file>', 'save stack param values in the given file')
	.action((options) => {
		swizzle.swizzleStackInit(options)
	})

program
	.command('config', {isDefault: true})
	.alias('c')
	.description('continue with current stack name, prompt for missing parameters, swizzle code files')
	.option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files')
	.option('-s, --use-rc', 'save stack param values in the .swizzlerc file')
	.option('-f, --file <file>', 'save stack param values in the given file')
	.action((options) => {
		swizzle.swizzleStackConfig(options)
	})

program
	.command('stack <name>')
	.alias('s')
	.description('use given stack name, prompt for missing parameter values, swizzle code files')
	.option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files')
	.option('-s, --use-rc', 'save stack param values in the .swizzlerc file')
	.option('-f, --file <file>', 'save stack param values in the given file')
	.action((name, options) => {
		swizzle.swizzleStack(name, options)
	})

program
	.command('clean')
	.alias('c')
	.description('un-swizzle parameter values back to defaultValue and remove all stacks')
	.option('-v, --verbose', 'additional logging')
	.action((options) => {
		const params = {
			verbose: options.verbose
		}
		swizzle.clean(params)
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
