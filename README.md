# swizzle-params
Swizzle configuration parameter values in json and javascript files.

Configuration is expressed in JSON format and only supports Strings.

## to install
```
npm i -g swizzle-params
```

## usage
The command line actions and flags:
```
    add-param|ap [options]      add a parameter to swizzle config
    -n, --name <name>                   name of parameter
    -d, --desc <desc>                   description of parameter
    -v, --default-value <defaultValue>  default value of parameter

    remove-param|rp [options]   remove a parameter from swizzle config
    -n, --name <name>  name of parameter

    add-files|af [files...]     add code files to swizzle config

    remove-files|rf [files...]  remove code files from swizzle config

    stack|s [options] <name>    swizzle code files, prompt for any missing parameters in the stack
    -e, --edit-first   review and edit stack parameter values before swizzling code files
    -s, --use-rc       save stack param values in the .swizzlerc file
    -f, --file <file>  save stack param values in the given file


```

## example usage
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

> swizzle stack prod --use-rc
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
swizzle stack prod # will update the parameters to the prod config
swizzle stack dev  # will update the parameters to the dev config
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

To store your swizzle stack param values outside of source control, you can use the `--use-rc` or `--file` flags.

These flags only need to be specified when swizzling a stack for the first time.

Once a stack's location is stored in the .swizzlerc file, swizzle will find and use the specified location accordingly.

The `--file` flag specifies that param values should be stored in the specified file.

The `--use-rc` flag specifies that param values should be stored in the .swizzlerc file. It is short hand for --file ./.swizzlerc.

Find and store the prod stack param values in .swizzlerc file.
```
> swizzle stack prod --use-rc
```

Find and store the prod stack param values in the specified file.
```
> swizzle stack prod --file /users/me/swizzle-stacks.json
```

The swizzle command will search for a stack in this order (last one wins):
	1. search the stacks in swizzle.json stacks field
	2. search the stacks in .swizzlerc stacks field
	3. search each file listed in .swizzlerc stacks/[stack]/file field

If a stack currently resides in swizzle.json file and the `--use-rc` or `--file` flag is used, swizzle will cause the stack param values to be moved out of the swizzle.json file and stored in the .swizzlerc or stacks file accordingly.

The .swizzlerc file looks like this:
```
.swizzlerc {
	"stacks": {
		"dev": {
			"file": "/users/me/swizzle-stacks.json",
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
> swizzle stack prod --file ~/my-swizzle-stacks.json
```

If a stack does not exist, the user is prompted to enter the param values which are then stored in the specified file.


