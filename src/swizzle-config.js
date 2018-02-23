const snakeCase = require('lodash.snakecase')
const unique = require('lodash.uniq')

/**
 no fs operations
 **/

const keyCase = (text) => snakeCase(text).toUpperCase()
const descCase = (text) => snakeCase(text).toLowerCase().replace(/_/g, ' ')

const defaultConf = () => ({
	files: [],
	params: [],
	stacks: {}
})

class SwizzleConfig {

	constructor(swizzleJson) {
		this.state = Object.assign(defaultConf(), swizzleJson)
	}

	addFiles({files}) {
		this.state = conf(this.state, actions.addFiles(files))
	}

	removeFiles({files}) {
		this.state = conf(this.state, actions.removeFiles(files))
	}

	addParam({name, desc, defaultValue}) {
		this.state = conf(this.state, actions.addParam(name, desc, defaultValue))
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

	listFiles() {
		return this.state.files.slice()
	}

	listParams({verbose}) {
		return this.state.params.reduce((list, param) => {
			if (verbose) {
				list.push({name: param.name, description: param.description, "default": param.default})
			}
			list.push({name} = param)
			return list
		}, [])
	}

	listStacks({verbose}) {
		return Object.keys(this.state.stacks).reduce((list, name) => {
			if (verbose) {
				list.push(Object.assign({}, this.state.stacks[name]))
			}
			list.push({name})
			return list
		}, [])
	}

}

module.exports = {
	keyCase,
	descCase,
	defaultConf,
	SwizzleConfig
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
	addParam(name, description, defaultValue) {
		if (typeof description === 'undefined') {
			description = descCase(`Your-${name}`)
		}
		if (typeof defaultValue === 'undefined') {
			defaultValue = keyCase(`Your-${name}`)
		}
		return {
			type: 'add-param',
			param: {
				name,
				description,
				defaultValue
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

function files(state, action) {
	switch (action.type) {
		case 'add-files':
			return unique(state.concat(action.files))
		case 'remove-files':
			return state.filter((file) => !action.files.find((findFile) => file === findFile))
	}
	return state
}

function params(state, action) {
	switch (action.type) {
		case 'add-param':
			const param = state.find((d) => d.name === action.param.name)
			const newParam = {}
			Object.assign(newParam, param, action.param)
			return state.filter((d) => d.name !== action.param.name).concat(newParam)
		case 'remove-param':
			return state.filter((d) => d.name !== action.name)
	}
	return state
}

function stacks(state, action) {
	switch (action.type) {
		case 'add-stack':
			return Object.assign({}, state, {[action.name]: {params: action.params, file: action.file}})
		case 'remove-stack':
			return _.omit(state, action.name)
	}
	return state
}

function conf(state, action) {
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
