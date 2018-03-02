/*global describe, it, beforeEach*/
const assert = require('assert')
const sc = require('../src/config')
const Swizzle = require('../src/swizzle').Swizzle

describe('Swizzle', () => {
	let swizzleConfig, swizzle, sfs
	beforeEach(() => {
		sfs = {}
		swizzleConfig = new sc.SwizzleConfig()
		swizzle = new Swizzle(swizzleConfig, sfs)
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
				console.log(params, files)
				assert.deepEqual(params, {'test param': 'YOUR_TEST_PARAM'})
			}
			sfs.saveSwizzleConfig = ({conf, file}) => {
				console.log(conf, file)
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
			swizzle.clean()
		})
	})
})
