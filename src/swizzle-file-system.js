import fs from 'fs'
import fsx from 'fs-extra'
import home from 'os-homedir'
import path from 'path'
import {defaultConf} from './swizzle-config'
import defaultsDeep from 'lodash.defaultsdeep'
import omit from 'lodash.omit'
import pick from 'lodash.pick'

export const swizzleFileName = 'swizzle.json'

export const rcFileName = '.swizzlerc'

export class SwizzleFileSystem {

	swizzleSourceFiles({params, files}) {
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
			const text = this.readFile(file)
			const masked = text.replace(/\\"/g, mask)
			const updated = replaceList.reduce((modified, param) => {
				return modified.replace(param.find, param.withValue)
			}, masked)
			const unmasked = updated.replace(maskRegExp, '\\"')
			this.writeFile(file, unmasked)
			// fs.writeFileSync(file, unmasked, 'utf8')
			console.log('swizzled', file)
		})
	}

	saveSwizzleConfig({conf, file}) {
		const swizzleJson = pick(conf, ['files', 'params', 'stackName'])
		const rc = Object.assign({}, conf.rc, {stacks: {}})
		swizzleJson.stacks = {}
		const saveParams = conf.params.reduce((result, item) => {
			if (item.noSave) {
				return result
			}
			result.push(item.param)
			return result
		}, [])
		if (conf.stacks) {
			Object.keys(conf.stacks).forEach((stackName) => {
				let json = {stacks: {}}
				const stack = conf.stacks[stackName]
				const stackParams = pick(stack.params, saveParams)
				const entry = {[stackName]: stackParams}
				if (stack.file && stack.file === file) {
					defaultsDeep(swizzleJson.stacks, entry)
				} else {
					if (this.isFile(stack.file)) {
						json = this.readJsonFile({file: stack.file})
					}
					if (!json.stacks) {
						json.stacks = {}
					}
					Object.assign(json.stacks, entry)
					this.writeJsonFile({file: stack.file, json})
					rc.stacks[stackName] = {file: stack.file}
				}
			})
		}
		if (Object.keys(rc.stacks).length === 0) {
			delete rc.stacks
		} else {
			// todo handle merged rc files from ~ and . locations
			const rcFile = rc.filePath || rcFileName
			this.writeJsonFile({file: rcFile, json: rc})
		}
		if (!file) {
			file = this.getSwizzleJsonFilePath()
		}
		if (Object.keys(swizzleJson.stacks).length === 0) {
			delete swizzleJson.stacks
		}
		this.writeJsonFile({file, json: swizzleJson})
	}

	loadSwizzleConfig({file, rc}) {
		if (this.isFile(file)) {
			const swizzleJson = defaultsDeep(defaultConf(), this.readJsonFile({file}))
			swizzleJson.stacks = this.loadStacksFromJsonFile({file})
			swizzleJson.stacks = defaultsDeep({}, rc.stacks, swizzleJson.stacks)
			swizzleJson.rc = omit(rc, 'stacks');
			swizzleJson.filePath = file
			return swizzleJson
		}
		const swizzleJson = defaultConf()
		swizzleJson.stacks = defaultsDeep({}, rc.stacks)
		return swizzleJson
	}

	loadStacksFromJsonFile({file}) {
		const json = this.readJsonFile({file})
		const stacks = json.stacks ? json.stacks : {}
		return Object.keys(stacks).reduce((map, stackName) => {
			const stack = stacks[stackName]
			if (stack.file) {
				const stacksFile = this.readJsonFile({file: stack.file})
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

	loadRcConfig({rcFiles}) {
		const rc = {stacks: {}}
		const gotFileNames = rcFiles && rcFiles.length
		if (!gotFileNames) {
			return rc
		}
		rcFiles.forEach((file) => {
			if (/^~\//.test(file)) {
				file = this.resolvePath(this.home(), file.replace(/^~\//, ''))
			}
			if (this.isFile(file)) {
				rc.stacks.file = file
				// todo to support merging of rc files ...
				// need to keep the stacks with their rc
				// for now only use / allow one rc file
				// if multiple are give the last one wins
				return defaultsDeep(rc.stacks, this.loadStacksFromJsonFile({file}))
			}
		})
		return rc
	}

	getRcFilePathsIfExists() {
		const paths = []
		const localRc = this.resolvePath(this.cwd(), rcFileName)
		if (this.isFile(localRc)) {
			paths.push(localRc)
		}
		const homeRc = this.resolvePath(this.home(), rcFileName);
		if (this.isFile(homeRc)) {
			paths.push(homeRc)
		}
		return paths
	}

	getSwizzleJsonFilePath() {
		return this.resolvePath(this.cwd(), swizzleFileName)
	}

	readJsonFile({file}) {
		return JSON.parse(this.readFile(file, 'utf8'))
	}

	writeJsonFile({file, json}) {
		return fsx.outputJsonSync(file, json, {spaces: '\t'})
	}

	readFile(file) {
		return fs.readFileSync(file, 'utf8')
	}

	writeFile(file, text) {
		fs.writeFileSync(file, text, 'utf8')
	}

	resolvePath(...filePath) {
		return path.resolve.apply(path, filePath)
	}

	isFile(file) {
		return fsx.pathExistsSync(file)
	}

	cwd() {
		return process.cwd()
	}

	home() {
		return home()
	}

}

export const swizzleFileSystem = new SwizzleFileSystem()
