# swizzle-params
An opinionated approach to managing application configuration parameters.

The goal of this project is to capture all application configuration parameters into a single location in the app, reduce the need to swizzle source code files and promote some standardization for writing setup scripts.

## Install
```
npm i swizzle-params
```

Declare parameters in .json files and then import/require the files into code files. Use swizzle to document the parameters and change the parameter values.

## Usage
The command line actions and flags:
```
add-param|ap [options]                  add a parameter to swizzle.json
    -g, --generated                     generated parameter so do not prompt user
    -n, --name <name>                   name of parameter to add
    -d, --desc <desc>                   description of parameter
    -v, --default-value <defaultValue>  default value of parameter

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


## Example usage
For a working example, see the example-project directory.

```
> swizzle param add --name appKey --desc "the app key" --default-value abcd
> swizzle param add --name appPort --desc "the app listener port" --default-value 443
> swizzle add-files package.json app/package.json app/src/config.json

Modify the code files in the add-files list to seed the parameter values. Swizzle will not add them. It will only update existing.

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


## Overview
There are two kinds of parameters:
- a user entered value
- a generated value

With swizzle-params you:
- declare all the configuration parameters at design time in swizzle.json.
- write a setup script that populates the generated parameters using swizzle.updateGeneratedParams(...).
- run or invoke from your setup script `swizzle init` to prompt the user for parameter values.

Your project might look something like this:
```
/a-project
    /scripts
        generate-resources.js
    /src
        app.js
        config.swizzle.json
    package.json
    server.js
    swizzle.json
```

The key files for swizzle might look like this:
```
package.json:
    scripts:
        setup: swizzle init && ./scripts/generate-resources.js && npm run build && npm run deploy
        build: ...

generate-resources.js:
    import {Swizzle} from 'swizzle-params'
    const swizzle = new Swizzle()
    // create resources used by the app and generate the
    // params the app will use to access these resources
    const appUrl = getAppUrl()
    const appKey = getAppKey()
    swizzle.updateGeneratedParams({appUrl, appKey})

app.js:
    import {appUrl, appKey} from './config.swizzle.json'
    // use the generated parameters in the app
    // parameters will be documented in swizzle.json

```

The swizzle command will update param values in files based on following rules:

	• files to be swizzled must be added to the files list in swizzle.json
	• param values must be declared in JSON.parse-able format, like `{"<param>": "<value>"}`
	• param values must be String data type

Parameter name/values are not added or removed from code files.
You must add/remove the parameters in the code files manually.
This allows you to control which values go where in your project.

You can declare parameters as JavaScript objects in your code. Parameters must be in double quote format, e.g. `"<param>": "<value>"`.

For example
```
package.json {
	"config": {
		"appKey": "YOUR_APP_KEY",
		"appPort": "YOUR_APP_PORT"
	},
	"scripts": {
	    "setup": "swizzle i && npm run build && npm run deploy",
	    "build": "echo building",
	    "deploy": "KEY=$npm_package_config_appKey node server --port=$npm_package_config_appPort"
	}
}

app/config.json {
    "appKey": "YOUR_APP_KEY",
    "appPort": "YOUR_APP_PORT"
}

app/src/app.js {
	const config = require('../config.json')
	const appKey = config.appKey;
	const appPort = config.appPort;
}

app/server.js {
    const appKey = process.env.KEY
    const appPort = getPortFromArgv()
```

```
swizzle stack dev      # define parameter values for dev stack and swizzle
swizzle stack prod     # define parameter values for prod stack and swizzle
```

A swizzle.json file looks something like this:
```
swizzle.json {
	files: [
		"package.json",
		"app/package.json",
		"app/src/app.js"
	],
	params: [{
		param: "appKey",
		default: "abcd",
		description: "the app key"
	}, {
		param: "appPort",
		default: "443",
		description: "the app listener port"
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
			"file": "/users/me/swizzle-stacks.json",
		}
	}
}
```

If a stack does not exist, the user is prompted to enter the param values which are then stored in the specified file.

## Swizzling source code files? Don't.
By convention, don't swizzle source code files.

If you must swizzle source code files, the parameter values must be declared in strict JSON format and Strings, e.g. "param": "value", note the double quotes.

If you find the need to swizzle non-JSON files, say an HTML or CSS file, you should use a template file and transform the template at build/deploy time.
