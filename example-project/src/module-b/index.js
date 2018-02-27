// import {appPwd} from "../config";
const {appPwd} = require('../config.json')

exports.configureResources = function configureResources() {
	console.log(`configuring resource with credentials ${appPwd}`)
	return `resourceId_${Date.now()}`
}
