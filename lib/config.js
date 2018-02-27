'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SwizzleConfig = exports.defaultConf = exports.descCase = exports.keyCase = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.uniq');

var _lodash4 = _interopRequireDefault(_lodash3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 no fs operations, state changes only
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
		filePath: './swizzle.json'
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
			    generated = _ref3.generated;

			this.state = conf(this.state, actions.addParam(name, desc, defaultValue, generated));
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
		value: function listParams(_ref7) {
			var verbose = _ref7.verbose;

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
		value: function listStacks(_ref8) {
			var _this = this;

			var verbose = _ref8.verbose;

			return Object.keys(this.state.stacks).reduce(function (list, name) {
				if (verbose) {
					list.push(Object.assign({}, _this.state.stacks[name]));
				}
				list.push({ name: name });
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
		console.log(files, typeof files === 'undefined' ? 'undefined' : _typeof(files));
		return {
			type: 'remove-files',
			files: files
		};
	},
	addParam: function addParam(name, description, defaultValue, generated) {
		if (!name) {
			return;
		}
		if (typeof description === 'undefined') {
			description = descCase('Your-' + name);
		}
		if (typeof defaultValue === 'undefined') {
			if (generated) {
				defaultValue = 'generated';
			} else {
				defaultValue = keyCase('Your-' + name);
			}
		}
		return {
			type: 'add-param',
			param: {
				name: name,
				description: description,
				defaultValue: defaultValue,
				generated: generated
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

function files(state, action) {
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

function params(state, action) {
	switch (action.type) {
		case 'add-param':
			var existingParam = state.find(function (d) {
				return d.name === action.param.name;
			});
			var newParam = {};
			Object.assign(newParam, existingParam, action.param);
			if (action.param.generated !== true) {
				if (existingParam && existingParam.generated === true) {
					newParam.generated = true;
				} else {
					delete newParam.generated;
				}
			}
			if (existingParam) {
				return state.map(function (param) {
					if (param.name === newParam.name) {
						return newParam;
					}
					return param;
				});
			}
			return state.filter(function (d) {
				return d.name !== action.param.name;
			}).concat(newParam);
		case 'remove-param':
			return state.filter(function (d) {
				return d.name !== action.name;
			});
	}
	return state;
}

function stacks(state, action) {
	switch (action.type) {
		case 'add-stack':
			return Object.assign({}, state, _defineProperty({}, action.name, { params: action.params, file: action.file }));
		case 'remove-stack':
			return _.omit(state, action.name);
	}
	return state;
}

function conf(state, action) {
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
//# sourceMappingURL=config.js.map