// import {appKey, appPort, appPwd} from "../config";
const {appKey, appPort} = require('../config.js')

function getRandomNumber(min, max) {
	return (Math.random() * (max - min + 1) ) << 0
}

exports.configureApp = function configureApp(appPwd) {
	console.log(`configuring app ${appKey} for port ${appPort} using appPwd ${appPwd}`)
	const path = appKey.replace(/[\s\W]+/g, '-').toLowerCase()
	const version = getRandomNumber(0, 20)
	return `https://localhost:${appPort}/v${version}/${path}/app`
}
