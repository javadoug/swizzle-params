/*global describe, it, beforeEach*/
const assert = require('assert')
const sc = require('../src/swizzle-config')
const Swizzle = require('../src/swizzle').Swizzle

describe('Swizzle', () => {
	let swizzleConfig, swizzle, sfs, inquirer
	beforeEach(() => {
		sfs = {}
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
		assert.deepEqual(swizzle.conf.state, {files: [], params: [], rc: {}, stacks: {}, filePath: "./swizzle.json"})
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
					"filePath": "./swizzle.json",
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
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
			return swizzle.swizzleStack('dev').then(() => {
				assert.equal('dev', swizzle.conf.stackName)
			})
		})
		it('prompts user when prop is missing from stack', () => {
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
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
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
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
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
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
		it('sets stack file', () => {
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
			return swizzle.swizzleStack('dev', {file: 'test file'}).then(() => {
				assert.deepEqual('test file', swizzle.conf.state.stacks.dev.file)
			})
		})
		it('sets stack file .swizzlerc', () => {
			sfs.swizzleSourceFiles = () => {}
			sfs.saveSwizzleConfig = () => {}
			return swizzle.swizzleStack('dev', {useRc: true}).then(() => {
				assert.deepEqual('.swizzlerc', swizzle.conf.state.stacks.dev.file)
			})
		})
	})
})
