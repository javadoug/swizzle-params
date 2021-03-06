/*global describe, beforeEach, it*/
import assert from 'assert'
import {SwizzleConfig} from '../src';
import {defaultConf, conf, stacks, params, files} from '../src/swizzle-config';

describe('SwizzleConfig', () => {
	let testConf
	beforeEach(() => {
		testConf = defaultConf()
	})
	it('exists', () => {
		assert(typeof SwizzleConfig !== 'undefined', 'exists')
	})
	it('initializes with default empty config state', () => {
		const config = new SwizzleConfig()
		assert.deepEqual(config.state, testConf)
	})
	it('returns current stack name from state', () => {
		testConf.stackName = 'test stack name'
		const config = new SwizzleConfig(testConf)
		assert.deepEqual(config.stackName, 'test stack name')
	})
	it('sets current stack name on state', () => {
		const config = new SwizzleConfig(testConf)
		config.stackName = 'test stack name'
		assert.deepEqual(config.stackName, 'test stack name')
	})
	it('returns files list from state', () => {
		testConf.files = ['test files list']
		const config = new SwizzleConfig(testConf)
		config.stackName = 'test stack name'
		assert.deepEqual(config.files, ['test files list'])
	})
	it('addFiles() adds files to state', () => {
		const config = new SwizzleConfig(testConf)
		config.addFiles({files: ['test files list']})
		assert.deepEqual(config.files, ['test files list'])
	})
	it('removeFiles() removes files from state', () => {
		testConf.files = ['test files list', 'test remove this one']
		const config = new SwizzleConfig(testConf)
		config.removeFiles({files: ['test remove this one']})
		assert.deepEqual(config.files, ['test files list'])
	})
	describe('addParam()', () => {
		let param, config
		beforeEach(() => {
			param = {
				name: 'testAppKey'
			}
			config = new SwizzleConfig(testConf)
		})
		it('throws if no name prop given', () => {
			assert.throws(() => {
				config.addParam({name: ''})
			}, null, 'throws')
		})
		it('adds a parameter with nice defaults', () => {
			config.addParam(param)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'YOUR_TEST_APP_KEY',
				'description': 'your test app key'
			}])
		})
		it('adds multiple parameters with nice defaults', () => {
			config.addParam(param)
			config.addParam({name: 'testAppPort'})
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'YOUR_TEST_APP_KEY',
				'description': 'your test app key'
			}, {
				"defaultValue": "YOUR_TEST_APP_PORT",
				"description": "your test app port",
				"name": "testAppPort"
			}])
		})
		it('adds a parameter with generated prop', () => {
			param.generated = true
			config.addParam(param)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'generated',
				'description': 'your test app key',
				'generated': true
			}])
		})
		it('overrides existing parameter with new values', () => {
			config.addParam(param)
			param.description = 'test new description'
			param.defaultValue = 'test new default value'
			config.addParam(param)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'test new default value',
				'description': 'test new description'
			}])
		})
		it('supports "desc" as short for "description" prop', () => {
			config.addParam(param)
			param.desc = 'test new short prop'
			param.defaultValue = 'test new default value'
			config.addParam(param)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'test new default value',
				'description': 'test new short prop'
			}])
		})
		it('does not overrides existing generated flag if flag not present', () => {
			param.generated = true
			config.addParam(param)
			const updateParam = {
				name: 'testAppKey',
				desc: 'test update w/o changing defaultValue or generated props'
			}
			config.addParam(updateParam)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'generated',
				"description": updateParam.desc,
				"generated": true
			}])
		})
		it('overrides existing generated flag', () => {
			param.generated = true
			config.addParam(param)
			param.generated = false
			config.addParam(param)
			assert.deepEqual(config.params, [{
				name: 'testAppKey',
				'defaultValue': 'generated',
				'description': 'your test app key'
			}])
		})
	})
	it('removeParam() removes param from state', () => {
		const param = {
			name: 'testAppKey'
		}
		const config = new SwizzleConfig(testConf)
		config.addParam(param)
		config.removeParam({name: param.name})
		assert(config.params.length === 0, 'removes param')
	})
	it('addStack() add stack to state', () => {
		testConf.stacks = {
			test: 'test stacks'
		}
		const config = new SwizzleConfig(testConf)
		config.removeStack({name: 'test'})
		assert.deepEqual(config.state.stacks, {})
	})
	it('listParams() lists param names', () => {
		const config = new SwizzleConfig(testConf)
		config.addParam({name: 'testAppKey'})
		config.addParam({name: 'testAppPort'})
		const list = config.listParams()
		assert.deepEqual(list, ['testAppKey', 'testAppPort'])
	})
	it('listParams({verbose}) lists param details', () => {
		const config = new SwizzleConfig(testConf)
		config.addParam({name: 'testAppKey'})
		config.addParam({name: 'testAppPort'})
		const list = config.listParams({verbose: true})
		assert.deepEqual(list, [{
			"defaultValue": "YOUR_TEST_APP_KEY",
			"description": "your test app key",
			"name": "testAppKey"
		}, {
			"defaultValue": "YOUR_TEST_APP_PORT",
			"description": "your test app port",
			"name": "testAppPort"
		}])
	})
	it('listStacks() lists stacks names', () => {
		const config = new SwizzleConfig(testConf)
		config.addStack({name: 'test dev stack'})
		config.addStack({name: 'test staging stack'})
		const list = config.listStacks()
		assert.deepEqual(list, ['test dev stack', 'test staging stack'])
	})
	it('listStacks({verbose}) lists stacks with details', () => {
		const config = new SwizzleConfig(testConf)
		config.addStack({name: 'test dev stack', params: {foo: 'bar1'}})
		config.addStack({name: 'test staging stack', params: {foo: 'bar2'}})
		const list = config.listStacks({verbose: true})
		assert.deepEqual(list, [{
			"file": "",
			"params": {
				"foo": "bar1"
			}
		}, {
			"file": "",
			"params": {
				"foo": "bar2"
			}
		}])
	})
	describe('actions', () => {
		it('conf(state, action) default', () => {
			const result = conf(undefined, {})
			assert.deepEqual(result, testConf)
		})
		it('stacks(state, action) default', () => {
			const result = stacks(undefined, {})
			assert.deepEqual(result, [])
		})
		it('params(state, action) default', () => {
			const result = params(undefined, {})
			assert.deepEqual(result, [])
		})
		describe('params(state, action)', () => {
			let state, action
			beforeEach(() => {
				state = [{
					name: 'edit existing'
				}, {
					name: 'next param'
				}]
				action = {
					type: 'add-param',
					param: {
						name: 'edit existing',
						description: 'test edit existing'
					}
				}
			})
			it('new param: does not add password and noSave options', () => {
				action = {
					type: 'add-param',
					param: {
						name: 'add new',
						description: 'test add new',
						password: false,
						noSave: false
					}
				}
				state = []
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'add new',
						description: 'test add new',
						defaultValue: 'YOUR_ADD_NEW'
					}
				])
			})
			it('new param: adds password and noSave options', () => {
				action = {
					type: 'add-param',
					param: {
						name: 'add new',
						description: 'test add new',
						password: true,
						noSave: true
					}
				}
				state = []
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'add new',
						description: 'test add new',
						defaultValue: 'YOUR_ADD_NEW',
						password: true,
						noSave: true
					}
				])
			})
			it('existing param: adds password and noSave options', () => {
				state = [{
					name: 'edit existing'
				}]
				action.param.noSave = true
				action.param.password = true
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'edit existing',
						description: 'test edit existing',
						password: true,
						noSave: true
					}
				])
			})
			it('updates existing noSave param', () => {
				state = [{
					name: 'edit existing',
					noSave: true
				}]
				action.param.noSave = false
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'edit existing',
						description: 'test edit existing'
					}
				])
			})
			it('updates existing password param', () => {
				state = [{
					name: 'edit existing',
					password: true
				}]
				action.param.password = false
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'edit existing',
						description: 'test edit existing'
					}
				])
			})
			it('updates an existing param', () => {
				const result = params(state, action)
				assert.deepEqual(result, [
					{
						name: 'edit existing',
						description: 'test edit existing'
					}, {
						name: 'next param'
					}
				])
			})
		})
		it('files(state, action) default', () => {
			const result = files(undefined, {})
			assert.deepEqual(result, [])
		})
	})
})
