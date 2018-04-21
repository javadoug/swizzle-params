/*global describe, it, beforeEach*/
const assert = require('assert')
const validateUserInput = require('../src/validateUserInput').validateUserInput

describe('validateUserInput(userInput)', () => {
	let param
	beforeEach(() => {
		param = {}
	})
	it('validates basic regex', () => {
		param = {
			"msg": ".{3}"
		}
		const validate = validateUserInput(param)
		// positive assertions
		assert(validate('aaa') === true)
		assert(validate('1234') === true)
		// negative assertions
		assert(validate('aa') === 'msg')
	})
	it('supports "not:" option', () => {
		param = {
			"not option": "not: foobar"
		}
		const validate = validateUserInput(param)
		// positive assertions
		assert(validate('aaa') === true)
		assert(validate('1234') === true)
		// negative assertions
		assert(validate('foobar') === 'not option')
	})
	it('supports multiple validations', () => {
		param = {
			"not foobar": "not: foobar",
			"has number": "[0-9]{1}",
			"has upper case": "[A-Z]{1}",
			"minimum length": ".{3}"
		}
		const validate = validateUserInput(param)
		// positive assertions
		assert(validate('aB3') === true)
		assert(validate('cD34') === true)
		// negative assertions
		const result = validate('foobar')
		assert(result === 'not foobar has number has upper case')
	})
})