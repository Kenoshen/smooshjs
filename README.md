# smooshjs
A tool to compile a collection of javascript modules into a single library.

## Install
    npm install -g smooshjs

## Usage
    smoosh [-cjs, -amd] <path-to-main-module.js> [path-to-output]

For example:

    smoosh -cjs test/resources/cjs.entrypoint.js test/output/

## Tests
To run all the tests

    node mocha