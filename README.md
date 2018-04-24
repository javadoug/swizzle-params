# swizzle-params
opinionated approach to managing application configuration parameters
---
[![Build Status][build-status]](https://travis-ci.org/javadoug/swizzle-params)
[![Coverage Status][cover-status]](https://coveralls.io/github/javadoug/swizzle-params?branch=master)
![License](https://img.shields.io/badge/license-MIT-lightgray.svg)
---

- Define parameters in *.json files which you import/require in your code.
- Document parameters and where they are used in swizzle.json file.
- Use swizzle cli to manage the parameter values to prompt user as needed.

Features / Benefits

- document all application configuration parameters in a single location in the app
- store/use parameter values in files outside of source control
- prompt user for needed parameters as part of setup
- promote standardization for writing setup scripts
- reduce the need to swizzle source code files


## Requires
Node.js > v4.8.9 - build fails because the ES6 {nameValue} spread is not supported

## Install
```
npm i swizzle-params --save-dev

yarn add swizzle-params --dev
```

## Documenting Generated Parameter Values
In a CI/CD pipeline there is often a need to generate system resources like databases, queues, api gateways, etc. and then capture the urls to these endpoints to configure and connect your app to them.
You need to automate this process.

- declare all your configuration parameters in swizzle.json, including generated parameters values.
- write a script to generate resources and then add the generated parameter values using swizzle.updateGeneratedParams(...) in your script.
- write a script to coordinate the whole setup process.

The script that generates resources can use the parameter values collected from the user and then update the generated param values in the stack.

Your project might look something like this:
```
app/
    scripts/
        generate-resources.js   # and update generated param values
    src/
        app.js                  # import/require params from config.js
        config.js               # validate/transform params used by app
        config.json             # to be swizzled: exposes the app params
    package.json                # to be swizzled: exposes some runtime params
    server.js                   # imports params from package.json and process.env
    swizzle.json                # documents the params and which files are swizzled
```

The key files for your install / setup scripts might look like this:
```
app/package.json:
    config:
        appPort: YOUR_APP_PORT
        appUrl: YOUR_APP_URL
    scripts:
        setup: npm i && swizzle init && node ./scripts/generate-resources.js && npm run build && npm run deploy
        build: ...
        deploy: ...

app/scripts/generate-resources.js:
    import {Swizzle} from 'swizzle-params'
    const swizzle = new Swizzle()
    // create resources used by the app and generate the
    // params the app will use to access these resources
    const appUrl = getAppUrl()
    const appKey = getAppKey()
    swizzle.updateGeneratedParams({appUrl, appKey})

app/src/config.js:
    import config from './config.json'
    export const appKey = config.appKey
    export const appUrl = config.appUrl
    export const appPort = Number(config.appPort)

app/src/config.json:
    // this file is swizzled
    {
        "appKey": "YOUR_APP_KEY",
        "appUrl": "YOUR_APP_URL",
        "appPort": "YOUR_APP_PORT"
    }

app/src/app.js:
	const config = require('./config.js')
	const appKey = config.appKey;
	const appUrl = config.appUrl;
	const appPort = config.appPort;

app/server.js:
    const appKey = process.env.KEY
    const {appPort, appUrl} = require('./package.json').config
    // start the server on appPort using appKey
    console.log(`your api url is ${appUrl}`

swizzle.json:
    // defines which files are "swizzled"
    "files": ["src/config.json", "package.json"],
    // document all your parameters in one place
    "params": [
        {"name": "appPort", "description": "the app port", "default-value": "443"},
        {"name": "appKey", "description": "the app key", "default-value": "YOUR_APP_KEY", "generated": true},
        {"name": "appUrl", "description": "the app url", "default-value": "YOUR_APP_URL", "generated": true}
    ]

```


## Command Line Options
```
add-param|ap [options]                  add a parameter to swizzle.json
    -g, --generated                     generated parameter so do not prompt user
    -n, --name <name>                   name of parameter to add
    -d, --desc <desc>                   description of parameter
    -v, --default-value <defaultValue>  default value of parameter
    -p, --password                      do not print parameter value to terminal output
    -m, --mask                          do not save parameter value in files, uses the mask "no-save"

remove-param|rp [options]               remove a parameter from swizzle.json
    -n, --name <name>                   name of parameter to remove

add-files|af [files...]                 add code files to swizzle.json

remove-files|rf [files...]              remove code files from swizzle.json

init|i [options]                        prompt for stack name, prompt for missing parameters, swizzle code files
    -e, --edit-first                    review and edit stack parameter values, swizzle code files
    -s, --use-rc                        save stack param values in the .swizzlerc file
    -f, --file <file>                   save stack param values in the given file

config|c [options]                      continue with current stack name, prompt for missing parameters, swizzle code files
    -e, --edit-first                    review and edit stack parameter values, swizzle code files
    -s, --use-rc                        save stack param values in the .swizzlerc file
    -f, --file <file>                   save stack param values in the given file

stack|s [options] <name>                use given stack name, prompt for missing parameter values, swizzle code files
    -e, --edit-first                    review and edit stack parameter values, swizzle code files
    -s, --use-rc                        save stack param values in the .swizzlerc file
    -f, --file <file>                   save stack param values in the given file

clean|c [options]                       un-swizzle parameter values back to defaultValue and remove all stacks
```


### Example Usage
For a complete working example, see the example-project directory.

Note: when installed locally the path to the swizzle-cli is `./node_modules/.bin/swizzle` or `.\node_modules\.bin\swizzle` on Windows.
For convenience this documentation just uses swizzle.
Tip: in your terminal set PATH=$PATH:./node_modules/.bin before running these commands.

```
> swizzle add-param --name appKey --desc "the app key" --default-value abcd
> swizzle add-param --name appPort --desc "the app listener port" --default-value 443
> swizzle add-files package.json app/package.json app/src/config.json
```

Modify the code files in the add-files list to seed the parameters for swizzling.
Swizzle will not add them. It will only update existing.

Now you're ready to swizzle config params by stack.
```
> swizzle stack dev
> enter the app key (abcd): myAppKey
> enter the app listener port (443): 4443
> swizzled package.json
> swizzled app/package.json
> swizzled app/src/config.json

> swizzle stack prod --file ../../.stacks.json
> enter your app key (abcd): secrete
> enter your app port (443): 443
> swizzled package.json
> swizzled app/package.json
> swizzled app/src/config.json
```

The dev stack param values are stored in swizzle.json.
The prod stack param values are stored in .stacks.json.


## Overview: What is happening behind the scenes?
The swizzle command will update param values in files based on following rules:

	• files to be swizzled must be added to the files list in swizzle.json
	• param values must be declared in JSON.parse-able format, like `{"<param>": "<value>"}`
	• param values must be String data type

Parameter name/values are not added or removed from code files.
You must add/remove the parameters in the code files manually.
This allows you to control which values go where in your project.

A swizzle.json file looks something like this:
```
swizzle.json {
	files: [
		"package.json",
		"app/package.json",
		"app/src/app.js"
	],
	params: [{
		name: "appKey",
		defaultValue: "abcd",
		description: "the app key",
		choices: ["DEV Key", "INT Key", "UAT Key", "PRD Key"]
	}, {
        name: "appPort",
        defaultValue: "443",
        description: "the app listener port"
    }, {
        name: "appPwd",
        defaultValue: "s3cR3t!",
        password: true, // do not show on terminal screen
        noSave: true,   // do not save in files, always prompt user to enter it
        regex: {
            "must be longer than 3 characters": ".{3}",
            "must have capital letter": "[A-Z]{1}",
            "must have a number": "[0-9]{1}",
            "must have !, @, # char": "!|@|#",
            "must enter a password": "not: s3cR3t!"
        },
        description: "the app password"
    }],
	stacks: {
		dev: {
			"appKey": "myAppKey",
			"appPort": "4443"
		},
		prod: {
			"appKey": "secrete",
			"appPort": "443"
		}
	}
}
```

Note: additional parameters you can add to the swizzle.json file params:

    "choices: [...]" will prompt the user with given list of choices to select from.

    "password: true" will mask the user input in the terminal. If you store passwords in the file, make sure the file is not checked into source control. Use the `--file` to store the param values outside of the project dir.

    "noSave: true" will prevent the value from being saved to the disk and thus will always prompt the user to enter it.

    "regex: {msg: regex}"" will validate the user input.

To store your swizzle stack param values outside of source control, you can use the `--file` flags.

The `--file` flag specifies that param values should be stored in the specified file.

Only needs to be specified when swizzling a stack for the first time.

The stack's location is stored in the .swizzlerc file, swizzle will find and use the specified location accordingly.

Find and store the prod stack param values in the specified file.
```
> swizzle stack prod --file /users/me/swizzle-stacks.json
```

The swizzle command will search for a stack in this order (last one wins):
	1. search the stacks in swizzle.json stacks field
	2. search the stacks in .swizzlerc stacks field
	3. search each file listed in .swizzlerc stacks/[stack]/file field
	4. search stacks in file given on command line --file flag

If a stack currently resides in swizzle.json file and the `--file` flag is used, swizzle will cause the stack param values to be moved out of the swizzle.json file and stored in the specified stacks file.

The .swizzlerc file looks like this:
```
.swizzlerc {
	"stacks": {
		"prod": {
			"file": "/users/me/.stacks.json",
		}
	}
}
```

If a stack does not exist, the user is prompted to enter the param values which are then stored in the specified file.

## Swizzling source code files? Don't.
By convention, don't swizzle source code files.

Consider swizzling source code files a "code smell" for a couple of reasons: 1) parameters end up hidden in the code, which means digging through code to find them in a pinch.
2) modifying code to inject the parameter values on the target environment means the code you publish is not the code that runs.
And 3), without a convention for managing parameters, there is sure to be less documentation and verification of the parameters passed into your application.

To learn more about the inspiration for this project, read my blog post [Swizzled, Bamboozled and Dismayed].

If you must swizzle source code files, the parameter values must be declared in strict JSON format as Strings, e.g. "param": "value", note the double quotes.

If you find the need to swizzle non-JSON files, say an HTML or CSS file, transform a template file at build/deploy time.

[Swizzled, Bamboozled and Dismayed]: https://www.linkedin.com/pulse/swizzled-bamboozled-dismayed-douglas-ross
[build-status]: https://travis-ci.org/javadoug/swizzle-params.svg?branch=master
[cover-status]: https://coveralls.io/repos/github/javadoug/swizzle-params/badge.svg?branch=master
