# smooshjs
A tool to compile a collection of javascript modules into a single library.

## Install
    npm install -g smooshjs

## Usage (command line)
    smoosh [-cjs, -amd] <path-to-main-module.js> [path-to-output]

For example:

    smoosh -cjs test/resources/cjs.entrypoint.js test/output/

## Usage (within a node app/script)
    var smooshjs = require("smooshjs");

    var result = smooshjs("-cjs", "-amd", "path/to/main.js", "path/to/output.js");

    if (result.code === 0){
        // everything went ok!
    } else {
        // something failed
        console.error(result.output);
    }

## Tests
To run all the tests

    node mocha test