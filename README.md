# swizzle-params
Swizzle configuration parameter values in json and javascript files.

Configuration is expressed in JSON format and only supports Strings.

## to install
```
npm i -g swizzle-params
```

## basic usage
```
> swizzle param add --name appKey --desc "the app key" --default-value abcd
> swizzle param add --name appPort --desc "the app listener port" --default-value 443
> swizzle add-files package.json app/package.json app/src/app.js

Modify the code files to seed the parameter values.

> swizzle stack dev
> enter the app key (abcd): myAppKey
> enter the app listener port (443): 4443
> package.json
> app/package.json
> app/src/app.js

> swizzle stack prod --rc
> enter your app key (abcd): secrete
> enter your app port (443): 443
> package.json
> app/package.json
> app/src/app.js
```

The dev stack param values are stored in swizzle.json.
The prod stack param values are stored in .swizzlerc.

The swizzle stack command will update param values in files based on following rules:

	• files to be swizzled must be added to the files list
	• param values must be declared in JSON.parse-able format, like {"<param>": "<value>"}
	• param values must be String data type

Parameter name/values are not added or removed from code files. You must seed the parameter values in the code files manually.

Declare parameters in a .json file and then import/require the file into code files.

Or, declare parameters as javascript objects in your code. Parameters must be in double quote format.

For example
```
package.json {
	"config": {
		"appKey": "myAppKey",
		"appPort": "4443"
	},
	"scripts": {
	    "deploy": "deploy . --key=$npm_package_config_appKey --port=$npm_package_config_appPort"
	}

}

app/config.json {
    "appKey": "myAppKey",
    "appPort": "4443"
}

app/src/app.js {
	const config = {
		"appKey": "myAppKey",
		"appPort": "4443"
	}
	const appKey = config.appKey;
	const appPort = config.appPort;
}

app/src/app.js {
    import {appKey, appPort} from './config.json'
```

```
npm run myscript --key=$npm_package_config_appKey --port=$npm_package_config_appPort
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

To store your swizzle stack param values outside of source control, you can use the `--rc` or `--file` flags.

These flags only need to be specified when swizzling a stack for the first time.

Once a stack's location is stored in the .swizzlerc file, swizzle will find and use the specified location accordingly.

The `--file` flag specifies that param values should be stored in the specified file.

The `--rc` flag specifies that param values should be stored in the .swizzlerc file. It is short hand for --file ./.swizzlerc.

Find and store the prod stack param values in .swizzlerc file.
```
> swizzle --stack prod --rc
```

Find and store the prod stack param values in the specified file.
```
> swizzle --stack prod --file ~/swizzle-stacks.json
```

The swizzle command will search for a stack in this order (last one wins):
	1. search the stacks in swizzle.json stacks field
	2. search the stacks in .swizzlerc stacks field
	3. search each file listed in .swizzlerc stacks/[stack]/file field

If a stack currently resides in swizzle.json file and the `--rc` or `--file` flag is used, swizzle will cause the stack param values to be moved out of the swizzle.json file and stored in the .swizzlerc or stacks file accordingly.

The .swizzlerc file looks like this:
```
.swizzlerc {
	"stacks": {
		"dev": {
			"file": "~/swizzle-stacks.json",
		},
		"prod": {
			"params": {
				"appKey": "secrete",
				"appPort": "443"
			}
		}
	}
}
```

Specify a stacks file on the command line when you run swizzle.
```
> swizzle --stack prod --file ~/my-swizzle-stacks.json
```

Swizzle will use the specified file to find the prod stack param values. If the file does not exist, the user is prompted to create the file or cancel. If the stack is not found, the user is prompted to enter the param values which are then stored in the specified file.

The command line actions and flags:
```
swizzle 		:: prompt for param values, update files
--stack, -s 	:: specify a name for the param values
--copy, -c 		:: inject param values into source files
--rc, -r  		:: use .swizzlerc file for param values
--file, -f 		:: use specified file for param values

swizzle param 	:: add a param value to swizzle file
--name, -n 		:: name for a new param
--default, -d 	:: default value for a new param
--desc, -m 		:: message for displaying param names and values

swizzle files 	:: list or update the files list
--add, -a 		:: specify list of files to add to files list
--rem, -r 		:: specify list of files to remove from the list
--verbose, -v 	:: list source files and the param values in use

swizzle stacks 	:: list the swizzle stacks and location
--verbose, -v 	:: list the swizzle stacks, location and param values
```

## dependencies
- https://github.com/node-js-libs/cli
- https://www.npmjs.com/package/inquirer


