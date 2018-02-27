
// from npm script: RES_ID=$npm_package_config_appResource node index.js

const resId = process.env.RES_ID
const {appUrl, appResource, appKey} = require('./config.js')

if (resId !== appResource) {
	throw new TypeError(`missing process.env.RES_ID. expected '${appResource}' but got '${resId}'`)
}

console.log(`starting ${appKey} with ${appResource} at url: ${appUrl}`)

