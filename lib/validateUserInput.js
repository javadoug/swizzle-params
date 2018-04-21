'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var validateUserInput = exports.validateUserInput = function validateUserInput(regexParam) {
	return function (userInput) {
		var checks = Object.keys(regexParam).filter(function (msg) {
			var exp = regexParam[msg];
			var negate = /^not:\s*/.test(exp);
			var regex = new RegExp(negate ? exp.replace(/^not:\s*/, '') : exp);
			var showMessage = !regex.test(userInput);
			if (negate) {
				if (!showMessage) {
					return msg;
				}
			} else {
				if (showMessage) {
					return msg;
				}
			}
		});
		if (checks.length > 0) {
			return checks.join(' ');
		}
		// all validations for this param passed
		return true;
	};
};
//# sourceMappingURL=validateUserInput.js.map