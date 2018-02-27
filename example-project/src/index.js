
// from npm script: RES_ID=$npm_package_config_appResource node index.js

const resId = process.env.RES_ID
const {appUrl, appResource, appKey} = require('./config.js')
const trimWhiteSpace = /^\s+|\s+$/g

const trimmedEnvId = (resId || '').replace(trimWhiteSpace, '')
const trimmedConfigId =  (appResource || '').replace(trimWhiteSpace, '')

if (trimmedConfigId !== trimmedEnvId) {
	throw new TypeError(`missing process.env.RES_ID. expected '${trimmedConfigId}' but got '${trimmedEnvId}'`)
}

console.log(`starting "${appKey}" with ${trimmedConfigId} at url: ${appUrl}`)

