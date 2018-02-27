'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _config = require('./config');

var _fileSystem = require('./file-system');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// todo remove-param notifies which code files use this param
// todo add input validations to the add-param command
// todo inject inquirer into class so we can test w/o prompting

function initializeConfig(sfs) {
	// only uses ~/.swizzlerc or ./.swizzlerc - no merging yet
	var rcFile = sfs.getRcFilePathsIfExists();
	var rc = rcFile ? sfs.loadRcConfig({ rcFiles: [rcFile] }) : {};
	var swizzleFilePath = sfs.getSwizzleJsonFilePath();
	var conf = new _config.SwizzleConfig(sfs.loadSwizzleConfig({ file: swizzleFilePath, rc: rc }));
	return conf;
}

var Swizzle = function () {
	function Swizzle() {
		var _this = this;

		var conf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var sfs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _fileSystem.sfs;

		_classCallCheck(this, Swizzle);

		this.addParam = function (_ref) {
			var name = _ref.name,
			    desc = _ref.desc,
			    defaultValue = _ref.defaultValue,
			    generated = _ref.generated;

			var param = { name: name, desc: desc, defaultValue: defaultValue, generated: generated };
			_this.conf.addParam(param);
			_this.fs.saveSwizzleConfig({ file: _this.swizzleFilePath, conf: _this.conf.state });
		};

		this.updateGeneratedParams = function (generatedParams) {

			if (!(generatedParams && Object.keys(generatedParams).length)) {
				return;
			}

			var lastStack = _this.conf.stackName;

			var stack = _this.conf.state.stacks[lastStack];
			var saveSwizzleConfig = false;
			Object.keys(generatedParams).forEach(function (name) {
				var generated = true;
				var existingParam = _this.conf.state.params.find(function (p) {
					return p.name === name;
				});
				if (!existingParam) {
					saveSwizzleConfig = true;
					_this.conf.addParam({ name: name, generated: generated });
				}
			});

			if (saveSwizzleConfig) {
				_this.fs.saveSwizzleConfig({ file: _this.swizzleFilePath, conf: _this.conf.state });
			}

			if (!stack) {
				// there is no stack to swizzle
				// todo determine which use cases would hit this and
				// what the right response should be....
				return;
			}

			var params = {};
			Object.assign(params, stack.params, generatedParams);
			_this.conf.addStack({ name: lastStack, params: params, file: stack.file });
			_this.swizzleStack(lastStack, {});
		};

		this.removeParam = function (_ref2) {
			var name = _ref2.name;

			// todo notify which code files use this param
			var param = { name: name };
			var removeParam = _this.conf.state.params.find(function (p) {
				return p.name === name;
			});
			if (!removeParam) {
				console.log('param name is not found in swizzle config', name, _this.swizzleFilePath);
			}
			_this.conf.removeParam(param);
			_this.fs.saveSwizzleConfig({ file: _this.swizzleFilePath, conf: _this.conf.state });
		};

		this.addFiles = function (_ref3) {
			var files = _ref3.files;

			_this.conf.addFiles({ files: files });
			_this.fs.saveSwizzleConfig({ file: _this.swizzleFilePath, conf: _this.conf.state });
		};

		this.removeFiles = function (_ref4) {
			var files = _ref4.files;

			_this.conf.removeFiles({ files: files });
			_this.fs.saveSwizzleConfig({ file: _this.swizzleFilePath, conf: _this.conf.state });
		};

		this.swizzleStackInit = function (options) {

			var lastStack = _this.conf.stackName;

			var prompts = [{
				name: 'name',
				message: 'enter stack name',
				default: lastStack || 'dev'
			}];

			_inquirer2.default.prompt(prompts).then(function (answers) {
				_this.swizzleStack(answers.name, options);
			}).catch(console.error);
		};

		this.swizzleStackConfig = function (options) {

			var lastStack = _this.conf.stackName;

			var input = new Promise(function (resolve, reject) {
				if (lastStack) {
					resolve(lastStack);
					return;
				}
				var prompts = [{
					name: 'name',
					message: 'enter stack name',
					default: 'dev'
				}];

				_inquirer2.default.prompt(prompts).then(function (answers) {
					resolve(answers.name);
				}).catch(reject);
			});

			input.then(function (stackName) {
				return _this.swizzleStack(stackName, options);
			}).catch(console.error);
		};

		this.swizzleStack = function (name, _ref5) {
			var editFirst = _ref5.editFirst,
			    useRc = _ref5.useRc,
			    file = _ref5.file;


			var params = _this.conf.state.params;
			var stack = _this.conf.state.stacks[name] || {
				file: _this.swizzleFilePath,
				params: {}
			};

			if (useRc) {
				stack.file = '.swizzlerc';
			}

			if (file) {
				stack.file = file;
			}

			var questions = params.reduce(function (list, param) {
				var hasParam = !!stack.params[param.name];
				var askUser = editFirst || !(hasParam || param.generated);
				if (askUser) {
					var _name = param.name;
					var message = 'enter ' + param.description + (param.generated ? ' <generated>' : '');
					var defaultValue = stack.params[_name] ? stack.params[_name] : param.defaultValue;
					list.push({
						name: _name,
						message: message,
						default: defaultValue
					});
				}
				return list;
			}, []);

			var input = new Promise(function (resolve, reject) {
				if (stack.params && Object.keys(stack.params).length) if (questions.length === 0) {
					return resolve(stack);
				}
				_inquirer2.default.prompt(questions).then(function (answers) {
					Object.assign(stack.params, answers);
					return stack;
				}).then(resolve).catch(reject);
			});

			input.then(function (stack) {
				_this.conf.addStack({ name: name, params: stack.params, file: stack.file });
				_this.conf.stackName = name;
				_this.fs.saveSwizzleConfig({ conf: _this.conf.state, file: _this.swizzleFilePath });
				return stack.params;
			}).then(function (params) {
				if (_this.conf.files.length === 0) {
					console.log('nothing to swizzle: no files specified in swizzle.json');
					return;
				}
				_this.fs.swizzleSourceFiles({ params: params, files: _this.conf.files });
			}).catch(function (e) {
				return console.error(e);
			});
		};

		this.clean = function (_ref6) {
			var verbose = _ref6.verbose;

			var params = _this.conf.listParams({ verbose: true }).reduce(function (map, param) {
				map[param.name] = param.defaultValue || '';
				return map;
			}, {});
			_this.fs.swizzleSourceFiles({ params: params, files: _this.conf.files });
			var file = _this.conf.swizzleFilePath;
			delete _this.conf.state.stacks;
			delete _this.conf.state.stackName;
			_this.fs.saveSwizzleConfig({ conf: _this.conf.state, file: file });
			if (verbose) {
				console.log(params);
			}
		};

		if (conf instanceof _config.SwizzleConfig) {
			this.conf = conf;
		} else {
			this.conf = initializeConfig(sfs);
		}
		this.fs = sfs;
	}

	_createClass(Swizzle, [{
		key: 'swizzleFilePath',
		get: function get() {
			return this.conf.state.filePath;
		}
	}]);

	return Swizzle;
}();

exports.Swizzle = Swizzle;
//# sourceMappingURL=swizzle.js.map