'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SwizzleConfig = exports.defaultConf = exports.descCase = exports.keyCase = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.files = files;
exports.params = params;
exports.stacks = stacks;
exports.conf = conf;

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.uniq');

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require('lodash.omit');

var _lodash6 = _interopRequireDefault(_lodash5);

var _swizzleFileSystem = require('./swizzle-file-system');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 no file system operations, state changes only
 **/

var keyCase = exports.keyCase = function keyCase(text) {
	return (0, _lodash2.default)(text).toUpperCase();
};
var descCase = exports.descCase = function descCase(text) {
	return (0, _lodash2.default)(text).toLowerCase().replace(/_/g, ' ');
};

var defaultConf = exports.defaultConf = function defaultConf() {
	return {
		rc: {},
		files: [],
		params: [],
		stacks: {},
		filePath: _swizzleFileSystem.swizzleFileName
	};
};

var SwizzleConfig = exports.SwizzleConfig = function () {
	function SwizzleConfig(swizzleJson) {
		_classCallCheck(this, SwizzleConfig);

		this.state = Object.assign(defaultConf(), swizzleJson);
	}

	_createClass(SwizzleConfig, [{
		key: 'addFiles',
		value: function addFiles(_ref) {
			var files = _ref.files;

			this.state = conf(this.state, actions.addFiles(files));
		}
	}, {
		key: 'removeFiles',
		value: function removeFiles(_ref2) {
			var files = _ref2.files;

			this.state = conf(this.state, actions.removeFiles(files));
		}
	}, {
		key: 'addParam',
		value: function addParam(_ref3) {
			var name = _ref3.name,
			    desc = _ref3.desc,
			    defaultValue = _ref3.defaultValue,
			    generated = _ref3.generated,
			    description = _ref3.description,
			    password = _ref3.password,
			    noSave = _ref3.noSave;

			// support short or long name as a convenience
			description = description || desc;
			this.state = conf(this.state, actions.addParam(name, description, defaultValue, generated, password, noSave));
		}
	}, {
		key: 'removeParam',
		value: function removeParam(_ref4) {
			var name = _ref4.name;

			this.state = conf(this.state, actions.removeParam(name));
		}
	}, {
		key: 'addStack',
		value: function addStack(_ref5) {
			var name = _ref5.name,
			    params = _ref5.params,
			    file = _ref5.file;

			this.state = conf(this.state, actions.addStack(name, params, file));
		}
	}, {
		key: 'removeStack',
		value: function removeStack(_ref6) {
			var name = _ref6.name;

			this.state = conf(this.state, actions.removeStack(name));
		}
	}, {
		key: 'listParams',
		value: function listParams() {
			var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { verbose: false },
			    verbose = _ref7.verbose;

			return this.state.params.reduce(function (list, param) {
				if (verbose) {
					list.push({ name: param.name, description: param.description, defaultValue: param.defaultValue });
				} else {
					list.push(param.name);
				}
				return list;
			}, []);
		}
	}, {
		key: 'listStacks',
		value: function listStacks() {
			var _this = this;

			var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { verbose: false },
			    verbose = _ref8.verbose;

			return Object.keys(this.state.stacks).reduce(function (list, name) {
				if (verbose) {
					list.push(Object.assign({}, _this.state.stacks[name]));
				} else {
					list.push(name);
				}
				return list;
			}, []);
		}
	}, {
		key: 'stackName',
		get: function get() {
			return this.state.stackName;
		},
		set: function set(name) {
			this.state.stackName = name;
		}
	}, {
		key: 'files',
		get: function get() {
			return this.state.files.filter(function (d) {
				return d;
			});
		}
	}, {
		key: 'params',
		get: function get() {
			return this.state.params.map(function (param) {
				return Object.assign({}, param);
			});
		}
	}, {
		key: 'stacks',
		get: function get() {
			return this.state.stacks;
		}
	}]);

	return SwizzleConfig;
}();

var actions = {
	addFiles: function addFiles(files) {
		return {
			type: 'add-files',
			files: files
		};
	},
	removeFiles: function removeFiles(files) {
		return {
			type: 'remove-files',
			files: files
		};
	},
	addParam: function addParam(name, description, defaultValue, generated, password, noSave) {
		if (!name) {
			throw new TypeError('a parameter name is required');
		}
		return {
			type: 'add-param',
			param: {
				name: name,
				description: description,
				defaultValue: defaultValue,
				generated: generated,
				password: password,
				noSave: noSave
			}
		};
	},
	removeParam: function removeParam(name) {
		return {
			type: 'remove-param',
			name: name
		};
	},
	addStack: function addStack(name, params, file) {
		return {
			type: 'add-stack',
			name: name,
			params: params,
			file: file
		};
	},
	removeStack: function removeStack(name) {
		return {
			type: 'remove-stack',
			name: name
		};
	}
};

function files() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var action = arguments[1];

	switch (action.type) {
		case 'add-files':
			return (0, _lodash4.default)(state.concat(action.files));
		case 'remove-files':
			return state.filter(function (file) {
				return !action.files.find(function (findFile) {
					return file === findFile;
				});
			});
	}
	return state;
}

function params() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var action = arguments[1];


	switch (action.type) {

		case 'add-param':
			var existingParam = state.find(function (d) {
				return d.name === action.param.name;
			});
			var _action$param = action.param,
			    name = _action$param.name,
			    description = _action$param.description,
			    defaultValue = _action$param.defaultValue,
			    generated = _action$param.generated,
			    password = _action$param.password,
			    noSave = _action$param.noSave;

			var newParam = {};
			if (existingParam) {
				// update an existing parameter
				Object.assign(newParam, existingParam);
				if (typeof description !== 'undefined') {
					newParam.description = description;
				}
				if (typeof defaultValue !== 'undefined') {
					newParam.defaultValue = defaultValue;
				}
				if (typeof noSave !== 'undefined') {
					newParam.noSave = noSave;
				}
				if (typeof password !== 'undefined') {
					newParam.password = password;
				}
				if (typeof generated !== 'undefined') {
					newParam.generated = generated;
				}
				// remove boolean parameters that are not true
				if (newParam.noSave !== true) {
					delete newParam.noSave;
				}
				if (newParam.password !== true) {
					delete newParam.password;
				}
				if (newParam.generated !== true) {
					delete newParam.generated;
				}
				// return list of params replacing the new one in position
				return state.map(function (param) {
					if (param.name === name) {
						return newParam;
					}
					return param;
				});
			}
			// adding a new parameter
			Object.assign(newParam, { name: name, description: description, defaultValue: defaultValue, generated: generated, password: password, noSave: noSave });
			if (typeof newParam.description === 'undefined') {
				newParam.description = descCase('Your-' + action.param.name);
			}
			if (typeof newParam.defaultValue === 'undefined') {
				if (newParam.generated === true) {
					newParam.defaultValue = 'generated';
				} else {
					newParam.defaultValue = keyCase('Your-' + action.param.name);
				}
			}
			// remove boolean parameters that are not true
			if (newParam.noSave !== true) {
				delete newParam.noSave;
			}
			if (newParam.password !== true) {
				delete newParam.password;
			}
			if (newParam.generated !== true) {
				delete newParam.generated;
			}
			return state.concat(newParam);

		case 'remove-param':
			return state.filter(function (d) {
				return d.name !== action.name;
			});

		default:
			return state;
	}
}

function stacks() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var action = arguments[1];

	switch (action.type) {
		case 'add-stack':
			return Object.assign({}, state, _defineProperty({}, action.name, { params: action.params, file: action.file || '' }));
		case 'remove-stack':
			return (0, _lodash6.default)(state, action.name);
	}
	return state;
}

function conf() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultConf();
	var action = arguments[1];

	switch (action.type) {
		case 'add-files':
		case 'remove-files':
			return Object.assign(state, { files: files(state.files, action) });
		case 'add-param':
		case 'remove-param':
			return Object.assign(state, { params: params(state.params, action) });
		case 'add-stack':
		case 'remove-stack':
			return Object.assign(state, { stacks: stacks(state.stacks, action) });
	}
	return state;
}
//# sourceMappingURL=swizzle-config.js.map