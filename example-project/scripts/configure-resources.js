#! /usr/bin/env node --harmony

/*
	simulate collecting deploy-time generated configuration parameters
 */

const {Swizzle} = require('swizzle-params')
const {configureApp} = require('../src/module-a')
const {configureResources} = require('../src/module-b')

const swizzle = new Swizzle()

// pass configuration parameters into dependencies
// current stack params available on stack property
const appUrl = configureApp(swizzle.stack.appPwd)
const appResource = configureResources(swizzle.stack.dbPwd)

// pass generated configuration parameters to swizzle
// to document them in a central location for easy debug
// updateGeneratedParams() will swizzle the config files
swizzle.updateGeneratedParams({appUrl, appResource})
