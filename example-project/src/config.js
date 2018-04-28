const config = require('./config.json')

// optionally the config can be defined in js file
// const config = {
// 	"appKey": "DEV KEY",
// 	"appPort": "666",
// 	"appPwd": "4rT",
// 	"appUrl": "https://localhost:666/v12/dev-key/app",
// 	"appResource": "resourceId_1524957230253"
// }

if (isNaN(Number(config.appPort))) {
	throw new TypeError('appPort must be a number')
}

exports.appKey = config.appKey
exports.appPort = Number(config.appPort)
exports.appUrl = config.appUrl
exports.appPwd = config.appPwd
exports.appResource = config.appResource
