#! /usr/bin/env node --harmony
require("babel-register")

/*
	simulate collecting deploy-time generated configuration parameters
 */

const {Swizzle} = require('swizzle-params')
const {configureApp} = require('../src/module-a')
const {configureResources} = require('../src/module-b')

const swizzle = new Swizzle()

const appUrl = configureApp()
const appResource = configureResources()

swizzle.updateGeneratedParams({appUrl, appResource})
