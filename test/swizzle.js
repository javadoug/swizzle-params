/*global describe, it, beforeEach*/
const assert = require('assert')
const sc = require('../src/swizzle-config')
const Swizzle = require('../src/swizzle').Swizzle
const {initializeConfig} = require('../src/swizzle')
const {swizzleFileSystem, swizzleFileName} = require("../src/swizzle-file-system")

describe('Swizzle', () => {
	let swizzleConfig, swizzle, sfs, inquirer, filePath
	beforeEach(() => {
		sfs = {}
		filePath = swizzleFileSystem.getSwizzleJsonFilePath()
		inquirer = {
			prompt() {
				return Promise.resolve({answer: 'test prompt answer'})
			}
		}
		swizzleConfig = new sc.SwizzleConfig()
		swizzle = new Swizzle(swizzleConfig, sfs, inquirer)
	})
	it('exists', () => {
		assert(typeof Swizzle !== 'undefined', 'exists')
	})
	it('creates default instance', () => {
		const swizzle = new Swizzle()
		assert.deepEqual(swizzle.conf.state, {files: [], params: [], rc: {}, stacks: {}, filePath: swizzleFileName})
	})
	it('creates instance with given SwizzleConfig', () => {
		const conf = new sc.SwizzleConfig({params: {name: 'test-param'}})
		const swizzle = new Swizzle(conf)
		assert(conf === swizzle.conf, 'uses given SwizzleConfig')
	})
	it('addParam() adds user prompted param to swizzle.json', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.deepEqual(conf.params, [{
				name: 'test-add-param-name',
				description: 'your test add param name',
				defaultValue: 'YOUR_TEST_ADD_PARAM_NAME'
			}])
		}
		swizzle.addParam({name: 'test-add-param-name'})
	})
	it('addParam() adds generated param to swizzle.json', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.deepEqual(conf.params, [{
				name: 'test-add-gen-param',
				description: 'your test add gen param',
				defaultValue: 'generated',
				generated: true
			}])
		}
		swizzle.addParam({name: 'test-add-gen-param', generated: true})
	})
	it('removeParam() removes param from swizzle.json', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.deepEqual(conf.params, [])
		}
		swizzleConfig.state.params.push({name: 'test-remove-param'})
		swizzle.removeParam({name: 'test-remove-param'})
	})
	it('removeParam() does nothing if param does not exist', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.fail('should not call saveSwizzleConfig')
		}
		swizzleConfig.removeParam = () => assert.fail('should not call conf.removeParam')
		swizzleConfig.state.params.push({name: 'test-remove-param'})
		swizzle.removeParam({name: 'test-remove-param-does-not-exists'})
	})
	it('addFiles() adds files and saves swizzle.json', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.deepEqual(conf.files, ['test new file'])
		}
		swizzle.addFiles({files: ['test new file']})
	})
	it('removeFiles() removes files and saves swizzle.json', () => {
		sfs.saveSwizzleConfig = ({conf, file}) => {
			assert.deepEqual(conf.files, [])
		}
		swizzleConfig.state.files.push('test-remove-file')
		swizzle.removeFiles({files: ['test-remove-file']})
	})
	describe('updateGeneratedParams', () => {
		let expectedParams, generatedParamValues
		beforeEach(() => {
			swizzleConfig.addFiles({files: ['temp/sample.js']})
			generatedParamValues = {
				foobar: 'new foobar generated value'
			}
			expectedParams = [{
				name: 'foobar',
				description: 'foobar before test',
				defaultValue: 'generated',
				generated: true
			}]
		})
		it('handles undefined object', () => {
			sfs.saveSwizzleConfig = ({conf, file}) => {
				// console.log(JSON.stringify(conf, null, 2))
				expectedParams = []
				assert.deepEqual(conf.params, expectedParams)
			}
			swizzle.updateGeneratedParams()
		})
		it('handles empty object', () => {
			sfs.saveSwizzleConfig = ({conf, file}) => {
				// console.log(JSON.stringify(conf, null, 2))
				expectedParams = []
				assert.deepEqual(conf.params, expectedParams)
			}
			swizzle.updateGeneratedParams({})
		})
		it('adds generated params when no stack name given', () => {
			sfs.saveSwizzleConfig = ({conf, file}) => {
				// console.log(JSON.stringify(conf, null, 2))
				expectedParams = [
					{
						"name": "foobar",
						"description": "your foobar",
						"defaultValue": "generated",
						"generated": true
					}
				]
				assert.deepEqual(conf.params, expectedParams)
			}
			swizzle.updateGeneratedParams(generatedParamValues)
		})
		it('adds generated params when stack is given', () => {

			sfs.saveSwizzleConfig = ({conf, file}) => {
				// no-op
				// console.log(JSON.stringify(conf, null, 2))
				// assert.deepEqual(conf.params, expectedParams)
			}

			swizzleConfig.addParam({
				name: 'foobar',
				defaultValue: 'default value before test',
				desc: 'your foobar desc before test',
				generate: true
			})

			swizzleConfig.addStack({
				name: 'dev', params: {
					foobar: 'test dev stack value for foobar'
				}
			})

			sfs.swizzleSourceFiles = ({params, files}) => {
				// console.log('swizzling stack', params)
				assert.deepEqual(params, {foobar: generatedParamValues.foobar})
			}

			swizzleConfig.state.stackName = 'dev'
			return swizzle.updateGeneratedParams(generatedParamValues)

		})
	})
	describe('clean()', () => {
		beforeEach(() => {
			const name = 'dev'
			const params = {
				'test param': 'test param user entered value'
			}
			const file = 'test stack file path'
			swizzleConfig.addFiles({files: ['test-file']})
			swizzleConfig.addParam({name: 'test param'})
			swizzleConfig.state.stackName = name
			swizzleConfig.addStack({name, params, file})
		})
		it('removes all stack info and saves swizzle.json', () => {
			sfs.swizzleSourceFiles = ({params, files}) => {
				assert.deepEqual(params, {'test param': 'YOUR_TEST_PARAM'})
			}
			sfs.saveSwizzleConfig = ({conf, file}) => {
				assert.deepEqual(conf, {
					"filePath": swizzleFileName,
					"files": [
						"test-file"
					],
					"params": [
						{
							"defaultValue": "YOUR_TEST_PARAM",
							"description": "your test param",
							"name": "test param"
						}
					],
					"rc": {}
				})
			}
			swizzle.clean({verbose: true})
		})
		it('removes all stack info and saves swizzle.json', () => {
			sfs.swizzleSourceFiles = ({params, files}) => {
				assert.deepEqual(params, {'test param': 'YOUR_TEST_PARAM'})
			}
			sfs.saveSwizzleConfig = ({conf, file}) => {
				assert.deepEqual(conf, {
					"filePath": swizzleFileName,
					"files": [
						"test-file"
					],
					"params": [
						{
							"defaultValue": "YOUR_TEST_PARAM",
							"description": "your test param",
							"name": "test param"
						}
					],
					"rc": {}
				})
			}
			swizzle.clean()
		})
	})
	describe('swizzleStack(name, {editFirst, useRc, file})', () => {
		beforeEach(() => {
			swizzleConfig.addFiles({files: ['test file here']})
			swizzle.conf.state.params = [{
				name: 'test',
				description: 'test param description',
				defaultValue: 'test param default value'
			}]
		})
		it('handles no files', () => {
			swizzle.conf.state.files = []
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.equal('dev', swizzle.conf.stackName)
			})
		})
		it('sets stack file', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			return swizzle.swizzleStack('dev', {file: 'test file'}).then(() => {
				assert.deepEqual('test file', swizzle.conf.state.stacks.dev.file)
			})
		})
		it('sets stack file .swizzlerc', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			return swizzle.swizzleStack('dev', {useRc: true}).then(() => {
				assert.deepEqual('.swizzlerc', swizzle.conf.state.stacks.dev.file)
			})
		})
		it('prompts user when prop is missing from stack', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			inquirer.prompt = (questions) => {
				assert.deepEqual(questions, [{
					name: 'test',
					message: 'enter test param description',
					'default': 'test param default value'
				}])
				return Promise.resolve({answers: 'test answers'})
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.deepEqual('test answers', swizzle.conf.state.stacks.dev.params.answers)
			})
		})
		it('prompts user with choices', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			swizzle.conf.state.params = [{
				name: 'test choices',
				description: 'test param description',
				choices: ['test choice 1', 'test choice 2'],
				defaultValue: 'test choice default value'
			}]
			inquirer.prompt = (questions) => {
				assert.deepEqual(questions, [{
					name: 'test choices',
					type: 'list',
					choices: ['test choice 1', 'test choice 2'],
					message: 'enter test param description',
					'default': 'test choice default value'
				}])
				return Promise.resolve({answers: 'test answers'})
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.deepEqual('test answers', swizzle.conf.state.stacks.dev.params.answers)
			})
		})
		it('prompts user with validations', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			swizzle.conf.state.params = [{
				name: 'test regex',
				description: 'test regex description',
				regex: {
					"msg": "^[0-9]{3}"
				},
				defaultValue: 'test regex default value'
			}]
			inquirer.prompt = (questions) => {
				const validate = questions[0].validate
				delete questions[0].validate
				assert.deepEqual(questions, [{
					name: 'test regex',
					message: 'enter test regex description',
					'default': 'test regex default value'
				}])
				return Promise.resolve({answers: 'test answers'})
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.deepEqual('test answers', swizzle.conf.state.stacks.dev.params.answers)
			})
		})
		it('prompts user with password', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			swizzle.conf.state.params = [{
				name: 'test pwd',
				description: 'test pwd description',
				password: true,
				defaultValue: 'test pwd default value'
			}]
			inquirer.prompt = (questions) => {
				assert.deepEqual(questions, [{
					name: 'test pwd',
					type: 'password',
					message: 'enter test pwd description',
					'default': 'test pwd default value'
				}])
				return Promise.resolve({answers: 'test answers'})
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.deepEqual('test answers', swizzle.conf.state.stacks.dev.params.answers)
			})
		})
		it('prompts user with noSave option', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			swizzle.conf.state.stacks = {}
			swizzle.conf.state.params = [{
				name: 'test no save',
				description: 'test no save description',
				noSave: true,
				defaultValue: 'test no save default value'
			}]
			inquirer.prompt = (questions) => {
				assert.deepEqual(questions, [{
					name: 'test no save',
					message: 'enter test no save description',
					'default': 'test no save default value'
				}])
				return Promise.resolve({answers: 'test answers'})
			}
			return swizzle.swizzleStack('dev').then(() => {
				assert.deepEqual('test answers', swizzle.conf.state.stacks.dev.params.answers)
			})
		})
		it('does not prompt when stack params provide the values', () => {
			sfs.swizzleSourceFiles = () => {
			}
			sfs.saveSwizzleConfig = () => {
			}
			const stackParams = {
				'test pwd': 'test stack param value'
			}
			swizzleConfig.addStack({name: 'test', params: stackParams, file: 'test stack file'})
			swizzle.conf.state.params = [{
				name: 'test pwd',
				description: 'test pwd description',
				password: true,
				defaultValue: 'test pwd default value'
			}]
			inquirer.prompt = (questions) => {
				assert.fail('does not prompt when stack params provide the values')
				return Promise.reject('bad')
			}
			return swizzle.swizzleStack('test')
		})
		it('prompt when stack params provide the values but editFirst option given', () => {
			sfs.swizzleSourceFiles = (params) => {
				assert.deepEqual(params, {
					params: {
						'test pwd': 'test stack param value',
						answer: 'test answer'
					},
					files: ['test file here']
				})
			}
			sfs.saveSwizzleConfig = () => {
			}
			const stackParams = {
				'test pwd': 'test stack param value'
			}
			swizzleConfig.addStack({name: 'test', params: stackParams, file: 'test stack file'})
			swizzle.conf.state.params = [{
				name: 'test pwd',
				description: 'test pwd description',
				password: true,
				defaultValue: 'test pwd default value'
			}]
			inquirer.prompt = (questions) => {
				return Promise.resolve({answer: 'test answer'})
			}
			return swizzle.swizzleStack('test', {editFirst: true})
		})
		it('prompt with editFirst option shows all params including "generated" params', () => {
			sfs.swizzleSourceFiles = (params) => {
				assert.deepEqual(params, {
					params: {
						'test generated': 'test stack param value',
						answer: 'test answer'
					},
					files: ['test file here']
				})
			}
			sfs.saveSwizzleConfig = () => {
			}
			const stackParams = {
				'test generated': 'test stack param value'
			}
			swizzleConfig.addStack({name: 'test', params: stackParams, file: 'test stack file'})
			swizzle.conf.state.params = [{
				name: 'test generated',
				description: 'test generated description',
				generated: true,
				defaultValue: 'test generated default value'
			}]
			inquirer.prompt = (questions) => {
				return Promise.resolve({answer: 'test answer'})
			}
			return swizzle.swizzleStack('test', {editFirst: true})
		})
	})
	describe('swizzleStackConfig(options)', () => {
		it('prompts for stack', () => {
			swizzle.inquirer = {
				prompt() {
					return Promise.resolve({stackName: 'test stack name'})
				}
			}
			const optionsInput = {test: 'options'}
			swizzle.swizzleStack = (name, options) => {
				assert.equal(name, 'test stack name')
				assert.equal(options, optionsInput)
			}
			return swizzle.swizzleStackConfig(optionsInput)

		})
		it('does not prompt for stack when stackName is set', () => {
			inquirer = {
				prompt() {
					assert.fail('should not call prompt when stackName is set')
				}
			}
			swizzle.conf.state.stackName = 'test stack name'
			const optionsInput = {}
			swizzle.swizzleStack = (name, options) => {
				assert.equal(name, 'test stack name')
			}
			return swizzle.swizzleStackConfig(optionsInput)

		})
	})
	describe('swizzleStackInit(options)(', () => {
		it('prompts for stack with "dev" stackName', () => {
			// when no stackName exists in conf should default prompt to dev
			swizzle.conf.state.stackName = null
			swizzle.inquirer = {
				prompt(prompts) {
					assert.equal(prompts[0].default, 'dev')
					return Promise.resolve({stackName: 'test stack name'})
				}
			}
			const optionsInput = {test: 'options'}
			swizzle.swizzleStack = (name, options) => {
				assert.equal(name, 'test stack name')
				assert.equal(options, optionsInput)
			}
			return swizzle.swizzleStackInit(optionsInput)

		})
		it('prompts for stack with default stackName based on the conf.stackName', () => {
			swizzle.conf.state.stackName = 'test conf stack name'
			swizzle.inquirer = {
				prompt(prompts) {
					assert.equal(prompts[0].default, 'test conf stack name')
					return Promise.resolve({stackName: 'test stack name'})
				}
			}
			const optionsInput = {}
			swizzle.swizzleStack = (name, options) => {
				assert.equal(name, 'test stack name')
			}
			return swizzle.swizzleStackInit(optionsInput)

		})
	})
	describe('initializeConfig(sfs)', () => {
		it('creates new SwizzleConfig with defaults', () => {
			sfs.getRcFilePathsIfExists = () => null
			sfs.loadRcConfig = () => null
			sfs.getSwizzleJsonFilePath = () => 'test swizzle path'
			sfs.loadSwizzleConfig = () => ({})
			const result = initializeConfig(sfs)
			assert.deepEqual(result.state, {
				rc: {},
				files: [],
				params: [],
				stacks: {},
				filePath: swizzleFileName
			})
		})
	})
})
