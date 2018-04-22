const config = require('./config.json')

// optionally the config can be defined in js file
// const config = {
// 	"appKey": "YOUR_APP_KEY",
// 	"appPort": "YOUR_APP_PORT",
// 	"appPwd": "YOUR_APP_PWD",
// 	"appUrl": "generated",
// 	"appResource": "generated"
// }

if (isNaN(Number(config.appPort))) {
	throw new TypeError('appPort must be a number')
}

exports.appKey = config.appKey
exports.appPort = Number(config.appPort)
exports.appUrl = config.appUrl
exports.appPwd = config.appPwd
exports.appResource = config.appResource
