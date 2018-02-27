const fs = require('fs')
const fsx = require('fs-extra')
const assert = require('assert')
const {keyCase} = require('../src/config')
const {
	readJsonFile, writeJsonFile, loadRcConfig, loadSwizzleConfig,
	saveSwizzleConfig, swizzleSourceFiles
} = require("../src/file-system")

describe('swizzle-fs', () => {
	afterEach(() => {
		// fsx.removeSync('./temp')
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
		it('loads rc file', () => {
			const rc = loadRcConfig({rcFiles: ['./test/test-swizzlerc']})
			assert.deepEqual(rc, LOADED_SWIZZLE_RC)
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
						"param": "appKey",
						"default": "abcd",
						"description": "the app key"
					},
					{
						"param": "appPort",
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
})

const TEMP_SWIZZLE_JSON = {
	"files": [
		"./test/test.json",
		"./test/test.js"
	],
	"params": [
		{
			"param": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"param": "appPort",
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

const SWIZZLE_FILE_JSON = {
	"files": [
		"./test.json",
		"./test.js"
	],
	"params": [
		{
			"param": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"param": "appPort",
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
			"param": "appKey",
			"default": "abcd",
			"description": "the app key"
		},
		{
			"param": "appPort",
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
