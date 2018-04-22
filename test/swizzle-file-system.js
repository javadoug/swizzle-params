/*global describe, afterEach, it*/
const fs = require('fs')
const fsx = require('fs-extra')
const path = require('path')
const assert = require('assert')
const osHomeDir = require('os-homedir')
const {keyCase} = require('../src/swizzle-config')
const {swizzleFileSystem, rcFileName, swizzleFileName} = require("../src/swizzle-file-system")
const bugSaveConf = require('./bug-save-conf-failing.json')

const cwd = swizzleFileSystem.cwd.bind(swizzleFileSystem)
const home = swizzleFileSystem.home.bind(swizzleFileSystem)
const loadRcConfig = swizzleFileSystem.loadRcConfig.bind(swizzleFileSystem)
const readJsonFile = swizzleFileSystem.readJsonFile.bind(swizzleFileSystem)
const writeJsonFile = swizzleFileSystem.writeJsonFile.bind(swizzleFileSystem)
const loadSwizzleConfig = swizzleFileSystem.loadSwizzleConfig.bind(swizzleFileSystem)
const saveSwizzleConfig = swizzleFileSystem.saveSwizzleConfig.bind(swizzleFileSystem)
const swizzleSourceFiles = swizzleFileSystem.swizzleSourceFiles.bind(swizzleFileSystem)

describe('swizzle-file-system', () => {
	beforeEach(() => {
		swizzleFileSystem.cwd = () => {
			return path.resolve(__dirname, '../temp')
		}
		swizzleFileSystem.home = () => {
			return path.resolve(__dirname, '../temp/home')
		}
	})
	afterEach(() => {
		fsx.removeSync('./temp')
	})
	it('cwd()', () => {
		assert.equal(cwd(), process.cwd())
	})
	it('home()', () => {
		assert.equal(home(), osHomeDir())
	})
	describe('keyCase(text)', () => {
		it('handles null', () => {
			assert.equal(keyCase(null), '')
		})
		it('makes keys upper case snake', () => {
			assert.equal(keyCase('appKey-Test-fooBar'), 'APP_KEY_TEST_FOO_BAR')
		})
	})
	describe('saveJsonFile', () => {
		it('saves a json file', () => {
			writeJsonFile({file: './temp/save.json', json: SWIZZLE_FILE_JSON})
			const json = readJsonFile({file: './temp/save.json'})
			assert.deepEqual(json, SWIZZLE_FILE_JSON)
		})
	})
	describe('loadJsonFile', () => {
		it('loads a json file', () => {
			const json = readJsonFile({file: './test/test-swizzle-config.json'})
			assert.deepEqual(json, SWIZZLE_FILE_JSON)
		})
	})
	describe('loadRcConfig', () => {
		it(`loads rc file from "~/${rcFileName}"`, () => {
			// setup
			const homeRc = swizzleFileSystem.resolvePath(swizzleFileSystem.home(), rcFileName)
			swizzleFileSystem.writeJsonFile({file: homeRc, json: {stacks: {test: {params: {param: 'test param'}}}}})
			const rc = loadRcConfig({rcFiles: [`~/${rcFileName}`]})
			assert.deepEqual(rc, {
				stacks: {
					file: '/Users/onvelocity/swizzle-params/temp/home/.swizzlerc',
					test: {
						file: '/Users/onvelocity/swizzle-params/temp/home/.swizzlerc',
						params: {
							param: 'test param'
						}
					}
				}
			})
		});
		it('loads rc file', () => {
			const rc = loadRcConfig({rcFiles: ['./test/test-swizzlerc']})
			assert.deepEqual(rc, LOADED_SWIZZLE_RC)
		});
		it('skips if rcFiles is empty list', () => {
			const rc = loadRcConfig({rcFiles: []})
			assert.deepEqual(rc, {stacks: {}})
		});
		it('skips if rcFiles is not given', () => {
			const rc = loadRcConfig({})
			assert.deepEqual(rc, {stacks: {}})
		});
	})
	describe('loadSwizzleConfig', () => {
		it('loads config file', () => {
			const rc = {
				stacks: {
					"prod": {
						"file": "./test/temprc",
						"params": {
							"appKey": "swizzlerc",
							"appPort": "443"
						}
					}
				}
			}
			const config = loadSwizzleConfig({rc, file: './test/test-swizzle-config.json'})
			assert.deepEqual(config, LOADED_SWIZZLE_CONFIG)
		});
	})
	describe('saveSwizzleConfig', () => {
		it('saves config json to a file', () => {
			const conf = {
				"files": ['./test/test.json', './test/test.js'],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					},
					{
						"name": "appPort",
						"default": "443",
						"description": "the app listener port"
					}
				],
				"stacks": {
					"prod": {
						"file": "./temp/stacks.json",
						"params": {
							"appKey": "test app key",
							"appPort": "test app port"
						}
					},
					"dev": {
						"file": "./temp/swizzle.json",
						"params": {
							"appKey": "dev app key",
							"appPort": "dev app port"
						}
					}
				}
			}
			const file = './temp/swizzle.json'
			saveSwizzleConfig({conf, file})
			const json = readJsonFile({file})
			assert.deepEqual(json, TEMP_SWIZZLE_JSON)
		});
		it('removes empty stacks params', () => {
			const conf = {
				"files": ['./test/test.json', './test/test.js'],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					},
					{
						"name": "appPort",
						"default": "443",
						"description": "the app listener port"
					}
				],
				"stacks": {}
			}
			const file = './temp/swizzle.json'
			saveSwizzleConfig({conf, file})
			const json = readJsonFile({file})
			assert.deepEqual(json, {
				"files": [
					"./test/test.json",
					"./test/test.js"
				],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					},
					{
						"name": "appPort",
						"default": "443",
						"description": "the app listener port"
					}
				]
			})
		});
		it('defaults file to "./swizzle.json"', () => {
			const conf = {
				"files": ['./test/test.json', './test/test.js'],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					}
				]
			}
			const file = null
			saveSwizzleConfig({conf, file})
			const defaultFile = swizzleFileSystem.resolvePath(swizzleFileSystem.cwd(), 'swizzle.json')
			const json = readJsonFile({file: defaultFile})
			assert.deepEqual(json, {
				"files": [
					"./test/test.json",
					"./test/test.js"
				],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					}
				]
			})
		});
		it('saves stacks to files', () => {
			const swizzleFile = swizzleFileSystem.getSwizzleJsonFilePath()
			const otherFile = swizzleFileSystem.resolvePath(swizzleFileSystem.home(), 'other.swizzle.json')
			// file exists but does not have a stacks property
			swizzleFileSystem.writeJsonFile({file: otherFile, json: {}})
			const conf = {
				"files": ['./test/test.json', './test/test.js'],
				"params": [
					{
						"name": "appKey",
						"defaultValue": "abcd",
						"description": "the app key"
					}
				],
				"stacks": {
					swizzleFile: {
						file: swizzleFile,
						params: {
							appKey: 'swizzle file param'
						}
					},
					otherFile: {
						file: otherFile,
						params: {
							appKey: 'other swizzle file param'
						}
					}
				}
			}
			const file = swizzleFile
			saveSwizzleConfig({conf, file})
			const swizzleJson = readJsonFile({file: swizzleFile})
			const otherJson = readJsonFile({file: otherFile})
			assert.deepEqual(swizzleJson, {
				"files": [
					"./test/test.json",
					"./test/test.js"
				],
				"params": [
					{
						"name": "appKey",
						"defaultValue": "abcd",
						"description": "the app key"
					}
				],
				stacks: {
					swizzleFile: {
						appKey: 'swizzle file param'
					}
				}
			}, 'swizzle file')
			assert.deepEqual(otherJson, {
				stacks: {
					otherFile: {
						appKey: 'other swizzle file param'
					}
				}
			}, 'other swizzle file')
		})
		it('saves config json to a file omitting params with noSave option', () => {
			const conf = {
				"files": ['./test/test.json', './test/test.js'],
				"params": [
					{
						"name": "appKey",
						"default": "abcd",
						"description": "the app key"
					},
					{
						"name": "appPort",
						"default": "443",
						"description": "the app listener port"
					},
					{
						"name": "test no save param",
						"default": "test default no save param",
						"noSave": true
					}
				],
				"stacks": {
					"prod": {
						"file": "./temp/stacks.json",
						"params": {
							"appKey": "test app key",
							"appPort": "test app port",
							"test no save param": "<no-save>"
						}
					},
					"dev": {
						"file": "./temp/swizzle.json",
						"params": {
							"appKey": "dev app key",
							"appPort": "dev app port",
							"test no save param": "<no-save>"
						}
					}
				}
			}
			// note this is the dev stack file
			const file = './temp/swizzle.json'
			saveSwizzleConfig({conf, file})
			const json = readJsonFile({file})
			assert.deepEqual(json, TEMP_NO_SAVE_SWIZZLE_JSON)
		})
		it('fix bug: this config is not saving stack params to swizzle.json', () => {
			const swizzleFile = swizzleFileSystem.getSwizzleJsonFilePath()
			const file = swizzleFile
			console.log('file', file)
			saveSwizzleConfig({conf: bugSaveConf, file})
			const swizzleJson = readJsonFile({file: swizzleFile})
			assert.deepEqual(swizzleJson, BUG_SAVE_CONF_EXPECTED)
		})
	})
	describe('swizzleSourceFiles', () => {
		it('replaces values in source files', () => {
			const params = {
				"appKey": "test a \"new\" app key",
				"appPort": "test a \"new\" app port"
			}
			const files = [
				'./temp/sample.js',
				'./temp/sample.json'
			]
			fsx.outputFileSync('./temp/sample.js', SAMPLE_JS)
			fsx.outputFileSync('./temp/sample.json', SAMPLE_JSON)
			swizzleSourceFiles({params, files})
			const result = {
				js: fs.readFileSync('./temp/sample.js', 'utf8'),
				json: fs.readFileSync('./temp/sample.json', 'utf8')
			}
			const expect = {
				js: SAMPLE_JS_SWIZZLED,
				json: SAMPLE_JSON_SWIZZLED
			}
			assert.deepEqual(result, expect)
		});
	})
	describe('getRcFilePathsIfExists()', () => {
		it(`finds home and cwd "${rcFileName}" files`, () => {
			// setup
			const cwdRc = swizzleFileSystem.resolvePath(swizzleFileSystem.cwd(), rcFileName)
			const homeRc = swizzleFileSystem.resolvePath(swizzleFileSystem.home(), rcFileName)
			swizzleFileSystem.writeJsonFile({file: cwdRc, json: {}})
			swizzleFileSystem.writeJsonFile({file: homeRc, json: {}})
			const rcFiles = swizzleFileSystem.getRcFilePathsIfExists()
			assert.deepEqual(rcFiles, [
				'/Users/onvelocity/swizzle-params/temp/.swizzlerc',
				'/Users/onvelocity/swizzle-params/temp/home/.swizzlerc'
			])
		})
	})
	describe('loadStacksFromJsonFile({file})', () => {
		it('adds empty stacks if not in file', () => {
			const file = './temp/stacks.json'
			const json = {}
			writeJsonFile({file, json})
			const result = swizzleFileSystem.loadStacksFromJsonFile({file})
			assert.deepEqual(result, {})
		})
	})
})

const TEMP_SWIZZLE_JSON = {
	"files": [
		"./test/test.json",
		"./test/test.js"
	],
	"params": [
		{
			"name": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"name": "appPort",
			"default": "443",
			"description": "the app listener port"
		}
	],
	"stacks": {
		"dev": {
			"appKey": "dev app key",
			"appPort": "dev app port"
		}
	}
}

const TEMP_NO_SAVE_SWIZZLE_JSON = {
	"files": [
		"./test/test.json",
		"./test/test.js"
	],
	"params": [
		{
			"name": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"name": "appPort",
			"default": "443",
			"description": "the app listener port"
		},
		{
			"name": "test no save param",
			"default": "test default no save param",
			"noSave": true
		}
	],
	"stacks": {
		"dev": {
			"appKey": "dev app key",
			"appPort": "dev app port",
			"test no save param": "<no-save>"
		}
	}
}

const SWIZZLE_FILE_JSON = {
	"files": [
		"./test.json",
		"./test.js"
	],
	"params": [
		{
			"name": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"name": "appPort",
			"default": "443",
			"description": "the app listener port"
		}
	],
	"stacks": {
		"dev2": {
			"appKey": "myAppKey",
			"appPort": "4443"
		},
		"prod": {
			"appKey": "swizzle-config",
			"appPort": "443"
		}
	}
}

const LOADED_SWIZZLE_RC = {
	"stacks": {
		"file": "./test/test-swizzlerc",
		"prod": {
			"params": {
				"appKey": "swizzlerc",
				"appPort": "443"
			},
			"file": "./test/test-swizzlerc"
		},
		"dev1": {
			"params": {
				"appKey": "myAppKey",
				"appPort": "4443"
			},
			"file": "./test/test-swizzle-stacks.json"
		}
	}
}

const LOADED_SWIZZLE_CONFIG = {
	"filePath": "./test/test-swizzle-config.json",
	"files": [
		"./test.json",
		"./test.js"
	],
	"params": [
		{
			"name": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"name": "appPort",
			"default": "443",
			"description": "the app listener port"
		}
	],
	"stacks": {
		"prod": {
			"params": {
				"appKey": "swizzlerc",
				"appPort": "443"
			},
			"file": "./test/temprc"
		},
		"dev2": {
			"params": {
				"appKey": "myAppKey",
				"appPort": "4443"
			},
			"file": "./test/test-swizzle-config.json"
		}
	},
	"rc": {}
}

const SAMPLE_JS = `
const myConfig = {
	"appKey": "the \\"app key\\" here",
	"appPort": "app port"
}

export function getAppKey() {
	return myConfig.appKey
}

export function getAppPort() {
	return myConfig.appPort
}
`

const SAMPLE_JSON = `
{
	"myConfig": {
		"appKey": "app key",
		"appPort": "the \\"app port\\" here"
	},
	"other": "stuff"
}
`

const SAMPLE_JS_SWIZZLED = `
const myConfig = {
	"appKey": "test a \\"new\\" app key",
	"appPort": "test a \\"new\\" app port"
}

export function getAppKey() {
	return myConfig.appKey
}

export function getAppPort() {
	return myConfig.appPort
}
`

const SAMPLE_JSON_SWIZZLED = `
{
	"myConfig": {
		"appKey": "test a \\"new\\" app key",
		"appPort": "test a \\"new\\" app port"
	},
	"other": "stuff"
}
`

const BUG_SAVE_CONF_EXPECTED = {
	"files": [
		"package.json",
		"src/config.js",
		"src/config.json"
	],
	"params": [
		{
			"name": "appKey",
			"description": "your app key",
			"defaultValue": "YOUR_APP_KEY",
			"choices": [
				"DEV KEY",
				"UAT KEY",
				"PRD KEY"
			]
		},
		{
			"name": "appPort",
			"description": "your app port",
			"defaultValue": "YOUR_APP_PORT",
			"regex": {
				"value must be a number": "^[0-9]+$"
			}
		},
		{
			"name": "appPwd",
			"description": "your app pwd",
			"defaultValue": "YOUR_APP_PWD",
			"password": true,
			"noSave": true,
			"regex": {
				"must be at least 3 characters\n": ".{3}",
				"must have an upper case letter\n": "[A-Z]{1}",
				"must have a number\n": "[0-9]{1}",
				"you must enter a password": "not: YOUR_APP_PWD"
			}
		},
		{
			"name": "appUrl",
			"description": "your app url",
			"defaultValue": "generated",
			"generated": true
		},
		{
			"name": "appResource",
			"description": "your app resource",
			"defaultValue": "generated",
			"generated": true
		},
		{
			"name": "testPwd",
			"description": "test password",
			"defaultValue": "YOUR_TEST_PWD",
			"password": true
		}
	],
	"stacks": {
		"dev": {
			"appKey": "DEV KEY",
			"appPort": "333",
			"appPwd": "<no-save>", //--noSave flag should not save this to file
			"testPwd": "YOUR_TEST_PWD"
		}
	},
	"stackName": "dev"
}
