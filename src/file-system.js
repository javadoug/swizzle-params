import fs from 'fs'
import fsx from 'fs-extra'
import home from 'os-homedir'
import path from 'path'
import {defaultConf} from './config'
import defaultsDeep from 'lodash.defaultsdeep'
import omit from 'lodash.omit'
import pick from 'lodash.pick'

export const isFile = (file) => fsx.pathExistsSync(file)

export function swizzleSourceFiles({params, files}) {
	const replaceList = Object.keys(params).reduce((list, name) => {
		const value = JSON.stringify(params[name])
		// .*? means don't be greedy and stop at the first "
		const find = new RegExp(`"${name}":\\s*".*?"`, 'g')
		const withValue = `"${name}": ${value}`
		list.push({find, withValue})
		return list
	}, [])
	files.forEach((file) => {
		// replace "<name>": ".*?" with "<name>": "<value>"
		// support values that contain escaped double quotes by masking them
		// to minimize the risk of using a string in the file as our mask
		// use an unique mask to obscure the escaped double quote (\\")
		const key = Math.random().toString(28).slice(2, 10)
		const mask = `«MaskingEscapedDoubleQuotes_${key}»`
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

export function saveSwizzleConfig({conf, file}) {
	const swizzleJson = pick(conf, ['files', 'params', 'stackName'])
	const rc = Object.assign({}, conf.rc, {stacks: {}})
	swizzleJson.stacks = {}
	if (conf.stacks) {
		Object.keys(conf.stacks).forEach((stackName) => {
			let json = {stacks: {}}
			const stack = conf.stacks[stackName]
			const entry = {[stackName]: stack.params}
			// if this is the project ./swizzle.json file then add to config
			if (stack.file && stack.file !== file) {
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
	if (Object.keys(rc.stacks).length === 0) {
		delete rc.stacks
	} else {
		// todo handle merged rc files from ~ and . locations
		const rcFile = rc.filePath || '.swizzlerc'
		writeJsonFile({file: rcFile, json: rc})
	}
	if (!file) {
		file = './swizzle.json'
	}
	if (Object.keys(swizzleJson.stacks).length === 0) {
		delete swizzleJson.stacks
	}
	writeJsonFile({file, json: swizzleJson})
}

export function loadSwizzleConfig({file, rc}) {
	if (isFile(file)) {
		const swizzleJson = defaultsDeep(defaultConf(), readJsonFile({file}))
		swizzleJson.stacks = loadStacksFromJsonFile({file})
		swizzleJson.stacks = defaultsDeep({}, rc.stacks, swizzleJson.stacks)
		swizzleJson.rc = omit(rc, 'stacks');
		swizzleJson.filePath = file
		return swizzleJson
	}
	const swizzleJson = defaultConf()
	swizzleJson.stacks = defaultsDeep({}, rc.stacks)
	return swizzleJson
}

export function loadStacksFromJsonFile({file}) {
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

export function loadRcConfig({rcFiles}) {
	const rc = {stacks: {}}
	if (!(rcFiles || rcFiles.length === 0)) {
		return rc
	}
	rcFiles.reduce((rc, file) => {
		if (isFile(file)) {
			if (/^~\//.test(file)) {
				file = path.resolve(home(), file.replace(/^~\//, ''))
			}
			rc.file = file
			// todo to support merging of rc files ...
			// need to keep the stacks with their rc
			// for now only use / allow one rc file
			// if multiple are give the last one wins
			return defaultsDeep(rc, loadStacksFromJsonFile({file}))
		}
		return rc
	}, rc.stacks)
	return rc
}

export function readJsonFile({file}) {
	return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function writeJsonFile({file, json}) {
	return fsx.outputJsonSync(file, json, {spaces: '\t'})
}

export function getRcFilePathsIfExists() {
	const paths = []
	const localRc = path.resolve(process.cwd(), '.swizzlerc')
	if (isFile(localRc)) {
		paths.push(localRc)
	}
	const homeRc = path.resolve(home(), '.swizzlerc');
	if (isFile(homeRc)) {
		paths.push(homeRc)
	}
	return paths
}

export function getSwizzleJsonFilePath() {
	return path.resolve(process.cwd(), 'swizzle.json')
}

export const sfs = {
	isFile,
	swizzleSourceFiles,
	saveSwizzleConfig,
	loadSwizzleConfig,
	loadRcConfig,
	readJsonFile,
	writeJsonFile,
	getRcFilePathsIfExists,
	getSwizzleJsonFilePath
}
