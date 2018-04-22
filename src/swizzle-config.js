import snakeCase from 'lodash.snakecase'
import unique from 'lodash.uniq'
import omit from 'lodash.omit'
import {swizzleFileName} from './swizzle-file-system'

/**
 no file system operations, state changes only
 **/

export const keyCase = (text) => snakeCase(text).toUpperCase()
export const descCase = (text) => snakeCase(text).toLowerCase().replace(/_/g, ' ')

export const defaultConf = () => ({
	rc: {},
	files: [],
	params: [],
	stacks: {},
	filePath: swizzleFileName
})

export class SwizzleConfig {

	constructor(swizzleJson) {
		this.state = Object.assign(defaultConf(), swizzleJson)
	}

	get stackName() {
		return this.state.stackName
	}

	set stackName(name) {
		this.state.stackName = name
	}

	get files() {
		return this.state.files.filter((d) => d)
	}

	get params() {
		return this.state.params.map((param) => Object.assign({}, param))
	}

	addFiles({files}) {
		this.state = conf(this.state, actions.addFiles(files))
	}

	removeFiles({files}) {
		this.state = conf(this.state, actions.removeFiles(files))
	}

	addParam({name, desc, defaultValue, generated, description, password, noSave}) {
		// support short or long name as a convenience
		description = description || desc
		this.state = conf(this.state, actions.addParam(name, description, defaultValue, generated, password, noSave))
	}

	removeParam({name}) {
		this.state = conf(this.state, actions.removeParam(name))
	}

	addStack({name, params, file}) {
		this.state = conf(this.state, actions.addStack(name, params, file))
	}

	removeStack({name}) {
		this.state = conf(this.state, actions.removeStack(name))
	}

	listParams({verbose} = {verbose: false}) {
		return this.state.params.reduce((list, param) => {
			if (verbose) {
				list.push({name: param.name, description: param.description, defaultValue: param.defaultValue})
			} else {
				list.push(param.name)
			}
			return list
		}, [])
	}

	listStacks({verbose} = {verbose: false}) {
		return Object.keys(this.state.stacks).reduce((list, name) => {
			if (verbose) {
				list.push(Object.assign({}, this.state.stacks[name]))
			} else {
				list.push(name)
			}
			return list
		}, [])
	}

}

const actions = {
	addFiles(files) {
		return {
			type: 'add-files',
			files
		}
	},
	removeFiles(files) {
		return {
			type: 'remove-files',
			files
		}
	},
	addParam(name, description, defaultValue, generated, password, noSave) {
		if (!name) {
			throw new TypeError('a parameter name is required')
		}
		return {
			type: 'add-param',
			param: {
				name,
				description,
				defaultValue,
				generated,
				password,
				noSave
			}
		}
	},
	removeParam(name) {
		return {
			type: 'remove-param',
			name
		}
	},
	addStack(name, params, file) {
		return {
			type: 'add-stack',
			name,
			params,
			file
		}
	},
	removeStack(name) {
		return {
			type: 'remove-stack',
			name
		}
	}
}

export function files(state = [], action) {
	switch (action.type) {
		case 'add-files':
			return unique(state.concat(action.files))
		case 'remove-files':
			return state.filter((file) => !action.files.find((findFile) => file === findFile))
	}
	return state
}

export function params(state = [], action) {

	switch (action.type) {

		case 'add-param':
			const existingParam = state.find((d) => d.name === action.param.name)
			const {name, description, defaultValue, generated, password, noSave} = action.param
			const newParam = {}
			if (existingParam) {
				// update an existing parameter
				Object.assign(newParam, existingParam)
				if (typeof description !== 'undefined') {
					newParam.description = description
				}
				if (typeof defaultValue !== 'undefined') {
					newParam.defaultValue = defaultValue
				}
				if (typeof noSave !== 'undefined') {
					newParam.noSave = noSave
				}
				if (typeof password !== 'undefined') {
					newParam.password = password
				}
				if (typeof generated !== 'undefined') {
					newParam.generated = generated
				}
				// remove boolean parameters that are not true
				if (newParam.noSave !== true) {
					delete newParam.noSave
				}
				if (newParam.password !== true) {
					delete newParam.password
				}
				if (newParam.generated !== true) {
					delete newParam.generated
				}
				// return list of params replacing the new one in position
				return state.map((param) => {
					if (param.name === name) {
						return newParam
					}
					return param
				})
			}
			// adding a new parameter
			Object.assign(newParam, {name, description, defaultValue, generated, password, noSave})
			if (typeof newParam.description === 'undefined') {
				newParam.description = descCase(`Your-${action.param.name}`)
			}
			if (typeof newParam.defaultValue === 'undefined') {
				if (newParam.generated === true) {
					newParam.defaultValue = 'generated'
				} else {
					newParam.defaultValue = keyCase(`Your-${action.param.name}`)
				}
			}
			// remove boolean parameters that are not true
			if (newParam.noSave !== true) {
				delete newParam.noSave
			}
			if (newParam.password !== true) {
				delete newParam.password
			}
			if (newParam.generated !== true) {
				delete newParam.generated
			}
			return state.concat(newParam)

		case 'remove-param':
			return state.filter((d) => d.name !== action.name)

		default:
			return state
	}

}

export function stacks(state = [], action) {
	switch (action.type) {
		case 'add-stack':
			return Object.assign({}, state, {[action.name]: {params: action.params, file: action.file || ''}})
		case 'remove-stack':
			return omit(state, action.name)
	}
	return state
}

export function conf(state = defaultConf(), action) {
	switch (action.type) {
		case 'add-files':
		case 'remove-files':
			return Object.assign(state, {files: files(state.files, action)})
		case 'add-param':
		case 'remove-param':
			return Object.assign(state, {params: params(state.params, action)})
		case 'add-stack':
		case 'remove-stack':
			return Object.assign(state, {stacks: stacks(state.stacks, action)})
	}
	return state
}
