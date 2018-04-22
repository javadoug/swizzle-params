'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.swizzleFileSystem = exports.SwizzleFileSystem = exports.rcFileName = exports.swizzleFileName = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _osHomedir = require('os-homedir');

var _osHomedir2 = _interopRequireDefault(_osHomedir);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _swizzleConfig = require('./swizzle-config');

var _lodash = require('lodash.defaultsdeep');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.omit');

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require('lodash.pick');

var _lodash6 = _interopRequireDefault(_lodash5);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var swizzleFileName = exports.swizzleFileName = 'swizzle.json';

var rcFileName = exports.rcFileName = '.swizzlerc';

var SwizzleFileSystem = exports.SwizzleFileSystem = function () {
	function SwizzleFileSystem() {
		_classCallCheck(this, SwizzleFileSystem);
	}

	_createClass(SwizzleFileSystem, [{
		key: 'swizzleSourceFiles',
		value: function swizzleSourceFiles(_ref) {
			var _this = this;

			var params = _ref.params,
			    files = _ref.files;

			var replaceList = Object.keys(params).reduce(function (list, name) {
				var value = JSON.stringify(params[name]);
				// .*? means don't be greedy and stop at the first "
				var find = new RegExp('"' + name + '":\\s*".*?"', 'g');
				var withValue = '"' + name + '": ' + value;
				list.push({ find: find, withValue: withValue });
				return list;
			}, []);
			files.forEach(function (file) {
				// replace "<name>": ".*?" with "<name>": "<value>"
				// support values that contain escaped double quotes by masking them
				// to minimize the risk of using a string in the file as our mask
				// use an unique mask to obscure the escaped double quote (\\")
				var key = Math.random().toString(28).slice(2, 10);
				var mask = '\xABMaskingEscapedDoubleQuotes_' + key + '\xBB';
				var maskRegExp = new RegExp(mask, 'g');
				var text = _this.readFile(file);
				var masked = text.replace(/\\"/g, mask);
				var updated = replaceList.reduce(function (modified, param) {
					return modified.replace(param.find, param.withValue);
				}, masked);
				var unmasked = updated.replace(maskRegExp, '\\"');
				_this.writeFile(file, unmasked);
				// fs.writeFileSync(file, unmasked, 'utf8')
				console.log('swizzled', file);
			});
		}
	}, {
		key: 'saveSwizzleConfig',
		value: function saveSwizzleConfig(_ref2) {
			var _this2 = this;

			var conf = _ref2.conf,
			    file = _ref2.file;

			var swizzleJson = (0, _lodash6.default)(conf, ['files', 'params', 'stackName']);
			var rc = Object.assign({}, conf.rc, { stacks: {} });
			swizzleJson.stacks = {};
			var saveParams = conf.params.reduce(function (result, item) {
				if (item.noSave) {
					return result;
				}
				result.push(item.param);
				return result;
			}, []);
			if (conf.stacks) {
				Object.keys(conf.stacks).forEach(function (stackName) {
					var json = { stacks: {} };
					var stack = conf.stacks[stackName];
					var stackParams = (0, _lodash6.default)(stack.params, saveParams);
					var entry = _defineProperty({}, stackName, stackParams);
					if (stack.file && stack.file === file) {
						(0, _lodash2.default)(swizzleJson.stacks, entry);
					} else {
						if (_this2.isFile(stack.file)) {
							json = _this2.readJsonFile({ file: stack.file });
						}
						if (!json.stacks) {
							json.stacks = {};
						}
						Object.assign(json.stacks, entry);
						_this2.writeJsonFile({ file: stack.file, json: json });
						rc.stacks[stackName] = { file: stack.file };
					}
				});
			}
			if (Object.keys(rc.stacks).length === 0) {
				delete rc.stacks;
			} else {
				// todo handle merged rc files from ~ and . locations
				var rcFile = rc.filePath || rcFileName;
				this.writeJsonFile({ file: rcFile, json: rc });
			}
			if (!file) {
				file = this.getSwizzleJsonFilePath();
			}
			if (Object.keys(swizzleJson.stacks).length === 0) {
				delete swizzleJson.stacks;
			}
			this.writeJsonFile({ file: file, json: swizzleJson });
		}
	}, {
		key: 'loadSwizzleConfig',
		value: function loadSwizzleConfig(_ref3) {
			var file = _ref3.file,
			    rc = _ref3.rc;

			if (this.isFile(file)) {
				var _swizzleJson = (0, _lodash2.default)((0, _swizzleConfig.defaultConf)(), this.readJsonFile({ file: file }));
				_swizzleJson.stacks = this.loadStacksFromJsonFile({ file: file });
				_swizzleJson.stacks = (0, _lodash2.default)({}, rc.stacks, _swizzleJson.stacks);
				_swizzleJson.rc = (0, _lodash4.default)(rc, 'stacks');
				_swizzleJson.filePath = file;
				return _swizzleJson;
			}
			var swizzleJson = (0, _swizzleConfig.defaultConf)();
			swizzleJson.stacks = (0, _lodash2.default)({}, rc.stacks);
			return swizzleJson;
		}
	}, {
		key: 'loadStacksFromJsonFile',
		value: function loadStacksFromJsonFile(_ref4) {
			var _this3 = this;

			var file = _ref4.file;

			var json = this.readJsonFile({ file: file });
			var stacks = json.stacks ? json.stacks : {};
			return Object.keys(stacks).reduce(function (map, stackName) {
				var stack = stacks[stackName];
				if (stack.file) {
					var stacksFile = _this3.readJsonFile({ file: stack.file });
					var update = Object.keys(stacksFile.stacks).reduce(function (map, stackName) {
						var params = stacksFile.stacks[stackName];
						var entry = _defineProperty({}, stackName, { params: params, file: stack.file });
						return (0, _lodash2.default)(entry, map);
					}, {});
					return (0, _lodash2.default)(map, update);
				} else {
					var params = stack.params ? stack.params : stack;
					var entry = _defineProperty({}, stackName, { params: params, file: file });
					return (0, _lodash2.default)(entry, map);
				}
			}, {});
		}
	}, {
		key: 'loadRcConfig',
		value: function loadRcConfig(_ref5) {
			var _this4 = this;

			var rcFiles = _ref5.rcFiles;

			var rc = { stacks: {} };
			var gotFileNames = rcFiles && rcFiles.length;
			if (!gotFileNames) {
				return rc;
			}
			rcFiles.forEach(function (file) {
				if (/^~\//.test(file)) {
					file = _this4.resolvePath(_this4.home(), file.replace(/^~\//, ''));
				}
				if (_this4.isFile(file)) {
					rc.stacks.file = file;
					// todo to support merging of rc files ...
					// need to keep the stacks with their rc
					// for now only use / allow one rc file
					// if multiple are give the last one wins
					return (0, _lodash2.default)(rc.stacks, _this4.loadStacksFromJsonFile({ file: file }));
				}
			});
			return rc;
		}
	}, {
		key: 'getRcFilePathsIfExists',
		value: function getRcFilePathsIfExists() {
			var paths = [];
			var localRc = this.resolvePath(this.cwd(), rcFileName);
			if (this.isFile(localRc)) {
				paths.push(localRc);
			}
			var homeRc = this.resolvePath(this.home(), rcFileName);
			if (this.isFile(homeRc)) {
				paths.push(homeRc);
			}
			return paths;
		}
	}, {
		key: 'getSwizzleJsonFilePath',
		value: function getSwizzleJsonFilePath() {
			return this.resolvePath(this.cwd(), swizzleFileName);
		}
	}, {
		key: 'readJsonFile',
		value: function readJsonFile(_ref6) {
			var file = _ref6.file;

			return JSON.parse(this.readFile(file, 'utf8'));
		}
	}, {
		key: 'writeJsonFile',
		value: function writeJsonFile(_ref7) {
			var file = _ref7.file,
			    json = _ref7.json;

			return _fsExtra2.default.outputJsonSync(file, json, { spaces: '\t' });
		}
	}, {
		key: 'readFile',
		value: function readFile(file) {
			return _fs2.default.readFileSync(file, 'utf8');
		}
	}, {
		key: 'writeFile',
		value: function writeFile(file, text) {
			_fs2.default.writeFileSync(file, text, 'utf8');
		}
	}, {
		key: 'resolvePath',
		value: function resolvePath() {
			for (var _len = arguments.length, filePath = Array(_len), _key = 0; _key < _len; _key++) {
				filePath[_key] = arguments[_key];
			}

			return _path2.default.resolve.apply(_path2.default, filePath);
		}
	}, {
		key: 'isFile',
		value: function isFile(file) {
			return _fsExtra2.default.pathExistsSync(file);
		}
	}, {
		key: 'cwd',
		value: function cwd() {
			return process.cwd();
		}
	}, {
		key: 'home',
		value: function home() {
			return (0, _osHomedir2.default)();
		}
	}]);

	return SwizzleFileSystem;
}();

var swizzleFileSystem = exports.swizzleFileSystem = new SwizzleFileSystem();
//# sourceMappingURL=swizzle-file-system.js.map