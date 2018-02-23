const fs = require('fs')
const fsx = require('fs-extra')
const defaultConf = require('./swizzle-config').defaultConf
const defaultsDeep = require('lodash.defaultsdeep')
const omit = require('lodash.omit')
const pick = require('lodash.pick')

function swizzleSourceFiles({params, files}) {
	const replaceList = Object.keys(params).reduce((list, name) => {
		const value = JSON.stringify(params[name])
		const find = new RegExp(`"${name}":\\s*".*?"`, 'g')
		const withValue = `"${name}": ${value}`
		list.push({find, withValue})
		return list
	}, [])
	files.forEach((file) => {
		// support nested quotes by masking escaped double quotes
		// replace "<name>": ".*?" with "<name>": "<value>"
		const mask = `«MaskedDoubleQuote»`
		const maskRegExp = new RegExp(mask, 'g')
		const text = fs.readFileSync(file, 'utf8')
		const masked = text.replace(/\\"/g, mask)
		const updated = replaceList.reduce((modified, param) => {
			return modified.replace(param.find, param.withValue)
		}, masked)
		const unmasked = updated.replace(maskRegExp, '\\"')
		fs.writeFileSync(file, unmasked, 'utf8')
		console.log('swizzled', file)
	})
}

const isFile = (file) => fsx.pathExistsSync(file)

function saveSwizzleConfig({conf, file}) {
	const swizzleJson = pick(conf, ['files', 'params'])
	const rc = Object.assign({}, conf.rc, {stacks: {}})
	swizzleJson.stacks = {}
	if (conf.stacks) {
		Object.keys(conf.stacks).forEach((stackName) => {
			let json = {stacks: {}}
			const stack = conf.stacks[stackName]
			const entry = {[stackName]: stack.params}
			// if this is the project ./swizzle.json file then add to config
			if (stack.file && !/(^|\.\/)swizzle\.json/.test(stack.file)) {
				if (isFile(stack.file)) {
					json = readJsonFile({file: stack.file})
				}
				if (!json.stacks) {
					json.stacks = {}
				}
				Object.assign(json.stacks, entry)
				writeJsonFile({file: stack.file, json})
				rc.stacks[stackName] = {file: stack.file}
			} else {
				defaultsDeep(swizzleJson.stacks, entry)
			}
		})
	}
	if (Object.keys(rc.stacks).length) {
		writeJsonFile({file: '.swizzlerc', json: rc})
	}
	writeJsonFile({file, json: swizzleJson})
}

function loadSwizzleConfig({file, rc}) {
	if (isFile(file)) {
		const swizzleJson = defaultsDeep(defaultConf(), readJsonFile({file}))
		swizzleJson.stacks = loadStacksFromJsonFile({file})
		swizzleJson.stacks = defaultsDeep({}, rc.stacks, swizzleJson.stacks)
		swizzleJson.rc = omit(rc, 'stacks');
		return swizzleJson
	}
	const swizzleJson = defaultConf()
	swizzleJson.stacks = defaultsDeep({}, rc.stacks)
	return swizzleJson
}

function loadStacksFromJsonFile({file}) {
	const json = readJsonFile({file})
	const stacks = json.stacks ? json.stacks : {}
	return Object.keys(stacks).reduce((map, stackName) => {
		const stack = stacks[stackName]
		if (stack.file) {
			const stacksFile = readJsonFile({file: stack.file})
			const update = Object.keys(stacksFile.stacks).reduce((map, stackName) => {
				const params = stacksFile.stacks[stackName]
				const entry = {[stackName]: {params, file: stack.file}}
				return defaultsDeep(entry, map)
			}, {})
			return defaultsDeep(map, update)
		} else {
			const params = stack.params ? stack.params : stack
			const entry = {[stackName]: {params, file}}
			return defaultsDeep(entry, map)
		}
	}, {})
}

function loadRcConfig({rcFiles}) {
	const rc = {stacks: {}}
	rcFiles.reduce((rc, file) => {
		if (isFile(file)) {
			return defaultsDeep(rc, loadStacksFromJsonFile({file}))
		}
		return rc
	}, rc.stacks)
	return rc
}

function readJsonFile({file}) {
	return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJsonFile({file, json}) {
	return fsx.outputJsonSync(file, json, {spaces: '\t'})
}

module.exports = {
	writeJsonFile,
	readJsonFile,
	loadRcConfig,
	loadStacksFromJsonFile,
	loadSwizzleConfig,
	saveSwizzleConfig,
	swizzleSourceFiles
}
