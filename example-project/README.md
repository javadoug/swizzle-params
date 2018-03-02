# tiny-project
a tiny project showing how to use swizzle-params

This application does not do anything accept generate console.log messages.

## to deploy this tiny example
```
npm run setup
# on windows npm run win:setup
```

You should see the message `starting <appKey> with <appResource> at url: <appUrl>` with the value you entered for the `<appKey>` and the resource generated values, `<appResource>` and `<appUrl>`.


## how this project was written
Wrote config.json and config.js to manage the parameters used by the app.
Notice that config.js does some parameter validation.

Wrote the code files in src/index.js, src/module-a and src/module-b which import config.js.

Wrote the setup scripts in the package.json file and scripts/configure-resources.js file.

Used the swizzle command line to add the parameters and code files to swizzle.json.

```
npm i swizzle-params --save-dev

swizzle add-param -n appKey
swizzle add-param -n appPort
swizzle add-param -n appPwd
swizzle add-param -n appUrl -g
swizzle add-param -n appResource -g
swizzle add-files package.json src/config.js*

```

At this point the tiny project is ready to swizzle stack parameters.

Run the npm script 'setup' to define a stack, set the parameters and deploy the app.
