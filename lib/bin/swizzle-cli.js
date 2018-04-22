#!/usr/bin/env node --harmony
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _swizzleFileSystem = require('../swizzle-file-system');

var _swizzleConfig = require('../swizzle-config');

var _swizzle = require('../swizzle');

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// only uses ~/.swizzlerc or ./.swizzlerc
var rc = _swizzleFileSystem.swizzleFileSystem.loadRcConfig({ rcFiles: _swizzleFileSystem.swizzleFileSystem.getRcFilePathsIfExists() });
var conf = new _swizzleConfig.SwizzleConfig(_swizzleFileSystem.swizzleFileSystem.loadSwizzleConfig({ file: './swizzle.json', rc: rc }));
var swizzle = new _swizzle.Swizzle(conf, _swizzleFileSystem.swizzleFileSystem);

_commander2.default.version(_package2.default.version);

_commander2.default.command('add-param').alias('ap').description('add a parameter to swizzle.json').option('-g, --generated', 'generated parameter so do not prompt user').option('-n, --name <name>', 'name of parameter to add').option('-d, --desc <desc>', 'description of parameter').option('-v, --default-value <defaultValue>', 'default value of parameter').option('-p, --password', 'do not print parameter value to terminal output').option('-m, --mask', 'do not save parameter value in files, uses the mask "no-save"').action(function (options) {

	console.log('add-param %s%s%s--name "%s" --desc "%s" --default-value "%s"', options.generated ? '-g ' : '', options.password ? '--password ' : '', options.mask ? '--mask ' : '', options.name, options.desc ? options.desc : '', options.defaultValue ? options.defaultValue : '');

	var param = {
		name: options.name,
		desc: options.desc,
		defaultValue: options.defaultValue
	};

	if (options.mask) {
		param.noSave = true;
	} else {
		param.noSave = false;
	}

	if (options.password) {
		param.password = true;
	} else {
		param.password = false;
	}

	if (options.generated) {
		param.generated = true;
	} else {
		param.generated = false;
	}

	swizzle.addParam(param);

	console.log(samples());
});

_commander2.default.command('remove-param').alias('rp').description('remove a parameter from swizzle.json').option('-n, --name <name>', 'name of parameter to remove').action(function (options) {

	console.log('remove-param --name \'%s\'', options.name);

	// todo notify which code files use this param

	var param = {
		name: options.name
	};

	var removeParam = conf.state.params.find(function (p) {
		return p.name === param.name;
	});

	if (!removeParam) {
		console.log('param name is not found in swizzle.json', param.name);
		return;
	}

	console.log('be sure to remove this param from any code files to minimize errors.');
	console.log(samples(param.name));

	swizzle.removeParam(param);
});

_commander2.default.command('add-files [files...]').alias('af').description('add code files to swizzle.json').action(function (files) {

	console.log('add-files %s', files);

	swizzle.addFiles({ files: files });

	console.log('add the parameters needed in each code file:');
	console.log(samples());
	console.log('then run `swizzle stack <stack-name>` to enter parameters');
	console.log('and swizzle the configuration values in your code files.');
});

_commander2.default.command('remove-files [files...]').alias('rf').description('remove code files from swizzle.json').action(function (files) {

	console.log('files %s', files);

	if (typeof files === 'string') {
		files = [files];
	}

	swizzle.removeFiles({ files: files });
});

_commander2.default.command('init', { isDefault: true }).alias('i').description('prompt for stack name, prompt for missing parameters, swizzle code files').option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files').option('-s, --use-rc', 'save stack param values in the .swizzlerc file').option('-f, --file <file>', 'save stack param values in the given file').action(function (options) {
	swizzle.swizzleStackInit(options);
});

_commander2.default.command('config', { isDefault: true }).alias('c').description('continue with current stack name, prompt for missing parameters, swizzle code files').option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files').option('-s, --use-rc', 'save stack param values in the .swizzlerc file').option('-f, --file <file>', 'save stack param values in the given file').action(function (options) {
	swizzle.swizzleStackConfig(options);
});

_commander2.default.command('stack <name>').alias('s').description('use given stack name, prompt for missing parameter values, swizzle code files').option('-e, --edit-first', 'review and edit stack parameter values, swizzle code files').option('-s, --use-rc', 'save stack param values in the .swizzlerc file').option('-f, --file <file>', 'save stack param values in the given file').action(function (name, options) {
	swizzle.swizzleStack(name, options);
});

_commander2.default.command('clean').alias('c').description('un-swizzle parameter values back to defaultValue and remove all stacks').option('-v, --verbose', 'additional logging').action(function (options) {
	var params = {
		verbose: options.verbose
	};
	swizzle.clean(params);
});

_commander2.default.parse(process.argv);

function getValue(param) {
	if (param.defaultValue) {
		return param.defaultValue;
	}
	var value = param.description || param.name;
	return (0, _lodash2.default)('Your_' + value).toUpperCase();
}

function samples(paramName) {
	var params = conf.state.params.filter(function (p) {
		return paramName ? p.name === paramName : true;
	}).map(function (param) {
		var value = getValue(param);
		return '\n\t\t"' + param.name + '": "' + value + '"';
	}).join(',');
	return '\t{' + params + '\n\t}';
}
//# sourceMappingURL=swizzle-cli.js.map