'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.swizzleFileSystem = exports.isFile = undefined;
exports.swizzleSourceFiles = swizzleSourceFiles;
exports.saveSwizzleConfig = saveSwizzleConfig;
exports.loadSwizzleConfig = loadSwizzleConfig;
exports.loadStacksFromJsonFile = loadStacksFromJsonFile;
exports.loadRcConfig = loadRcConfig;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
exports.getRcFilePathsIfExists = getRcFilePathsIfExists;
exports.getSwizzleJsonFilePath = getSwizzleJsonFilePath;

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

var isFile = exports.isFile = function isFile(file) {
	return _fsExtra2.default.pathExistsSync(file);
};

function swizzleSourceFiles(_ref) {
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
		var text = _fs2.default.readFileSync(file, 'utf8');
		var masked = text.replace(/\\"/g, mask);
		var updated = replaceList.reduce(function (modified, param) {
			return modified.replace(param.find, param.withValue);
		}, masked);
		var unmasked = updated.replace(maskRegExp, '\\"');
		_fs2.default.writeFileSync(file, unmasked, 'utf8');
		console.log('swizzled', file);
	});
}

function saveSwizzleConfig(_ref2) {
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
			// if this is the project ./swizzle.json file then add to config
			if (stack.file && stack.file !== file) {
				if (isFile(stack.file)) {
					json = readJsonFile({ file: stack.file });
				}
				if (!json.stacks) {
					json.stacks = {};
				}
				Object.assign(json.stacks, entry);
				writeJsonFile({ file: stack.file, json: json });
				rc.stacks[stackName] = { file: stack.file };
			} else {
				(0, _lodash2.default)(swizzleJson.stacks, entry);
			}
		});
	}
	if (Object.keys(rc.stacks).length === 0) {
		delete rc.stacks;
	} else {
		// todo handle merged rc files from ~ and . locations
		var rcFile = rc.filePath || '.swizzlerc';
		writeJsonFile({ file: rcFile, json: rc });
	}
	if (!file) {
		file = './swizzle.json';
	}
	if (Object.keys(swizzleJson.stacks).length === 0) {
		delete swizzleJson.stacks;
	}
	writeJsonFile({ file: file, json: swizzleJson });
}

function loadSwizzleConfig(_ref3) {
	var file = _ref3.file,
	    rc = _ref3.rc;

	if (isFile(file)) {
		var _swizzleJson = (0, _lodash2.default)((0, _swizzleConfig.defaultConf)(), readJsonFile({ file: file }));
		_swizzleJson.stacks = loadStacksFromJsonFile({ file: file });
		_swizzleJson.stacks = (0, _lodash2.default)({}, rc.stacks, _swizzleJson.stacks);
		_swizzleJson.rc = (0, _lodash4.default)(rc, 'stacks');
		_swizzleJson.filePath = file;
		return _swizzleJson;
	}
	var swizzleJson = (0, _swizzleConfig.defaultConf)();
	swizzleJson.stacks = (0, _lodash2.default)({}, rc.stacks);
	return swizzleJson;
}

function loadStacksFromJsonFile(_ref4) {
	var file = _ref4.file;

	var json = readJsonFile({ file: file });
	var stacks = json.stacks ? json.stacks : {};
	return Object.keys(stacks).reduce(function (map, stackName) {
		var stack = stacks[stackName];
		if (stack.file) {
			var stacksFile = readJsonFile({ file: stack.file });
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

function loadRcConfig(_ref5) {
	var rcFiles = _ref5.rcFiles;

	var rc = { stacks: {} };
	if (!(rcFiles || rcFiles.length === 0)) {
		return rc;
	}
	rcFiles.reduce(function (rc, file) {
		if (isFile(file)) {
			if (/^~\//.test(file)) {
				file = _path2.default.resolve((0, _osHomedir2.default)(), file.replace(/^~\//, ''));
			}
			rc.file = file;
			// todo to support merging of rc files ...
			// need to keep the stacks with their rc
			// for now only use / allow one rc file
			// if multiple are give the last one wins
			return (0, _lodash2.default)(rc, loadStacksFromJsonFile({ file: file }));
		}
		return rc;
	}, rc.stacks);
	return rc;
}

function readJsonFile(_ref6) {
	var file = _ref6.file;

	return JSON.parse(_fs2.default.readFileSync(file, 'utf8'));
}

function writeJsonFile(_ref7) {
	var file = _ref7.file,
	    json = _ref7.json;

	return _fsExtra2.default.outputJsonSync(file, json, { spaces: '\t' });
}

function getRcFilePathsIfExists() {
	var paths = [];
	var localRc = _path2.default.resolve(process.cwd(), '.swizzlerc');
	if (isFile(localRc)) {
		paths.push(localRc);
	}
	var homeRc = _path2.default.resolve((0, _osHomedir2.default)(), '.swizzlerc');
	if (isFile(homeRc)) {
		paths.push(homeRc);
	}
	return paths;
}

function getSwizzleJsonFilePath() {
	return _path2.default.resolve(process.cwd(), 'swizzle.json');
}

var swizzleFileSystem = exports.swizzleFileSystem = {
	isFile: isFile,
	swizzleSourceFiles: swizzleSourceFiles,
	saveSwizzleConfig: saveSwizzleConfig,
	loadSwizzleConfig: loadSwizzleConfig,
	loadRcConfig: loadRcConfig,
	readJsonFile: readJsonFile,
	writeJsonFile: writeJsonFile,
	getRcFilePathsIfExists: getRcFilePathsIfExists,
	getSwizzleJsonFilePath: getSwizzleJsonFilePath
};
//# sourceMappingURL=swizzle-file-system.js.map