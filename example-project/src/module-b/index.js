// import {appPwd} from "../config"
const {appPwd} = require('../config.json')

exports.configureResources = function configureResources(dbPwd) {
	console.log(`configuring resource with credentials ${appPwd} and dbPwd ${dbPwd}`)
	return `resourceId_${Date.now()}`
}
