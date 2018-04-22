const config = require('./config.json')

// optionally the config can be defined in js file
// const config = {
// 	"appKey": "DEV KEY",
// 	"appPort": "8080",
// 	"appPwd": "<no-save>",
// 	"appUrl": "https://localhost:8080/v7/dev-key/app",
// 	"appResource": "resourceId_1524425894598"
// }

if (isNaN(Number(config.appPort))) {
	throw new TypeError('appPort must be a number')
}

exports.appKey = config.appKey
exports.appPort = Number(config.appPort)
exports.appUrl = config.appUrl
exports.appPwd = config.appPwd
exports.appResource = config.appResource
