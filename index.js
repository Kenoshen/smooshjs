#! /usr/bin/env node

var fs = require("fs");
var path = require("path");

function displayMessage(name){ console.log(fs.readFileSync(__dirname + "/messages/" + name + ".txt", "utf8")); }

var helpTag = false;
var amdTag = false;
var cjsTag = false;
var testTag = false;
var entryPoint = undefined;
var output = undefined;

for (var i = 2; i < process.argv.length; i++){
    var arg = process.argv[i];
    if (arg === "--help" || arg === "-help"){
        helpTag = true;
    } else if (arg === "--amd" || arg === "-amd"){
        amdTag = true;
    } else if (arg === "--cjs" || arg === "-cjs"){
        cjsTag = true;
    } else if (arg === "--test" || arg === "-test"){
        testTag = true;
    } else if (! entryPoint){
        entryPoint = arg;
    } else {
        output = arg;
    }
}

if (helpTag){
    displayMessage("help");
    process.exit(0);
}
if (!entryPoint){
    displayMessage("help");
    process.exit(1);
}
if (entryPoint.indexOf(".js") < 0){
    console.log("entry point must be a javascript file (end in .js)");
    process.exit(1);
}

if (!amdTag && !cjsTag){
    console.log("must provide at least one of the output tags (-amd  OR  -cjs)");
    process.exit(1);
}
if (amdTag && cjsTag){
    // TODO: figure out what to do when they want both
}

// TODO: check if entryPoint file exists
var entryPointStat;
try {
    entryPointStat = fs.statSync(entryPoint);
} catch (e){
    console.log("file at " + entryPoint + " does not exist");
    process.exit(1);
}
var entryPointPathParsed = path.parse(entryPoint);

if (entryPointStat.isDirectory()){
    console.log("file at " + entryPoint + " is a directory");
    process.exit(1);
}

if (!output){
    output = entryPointPathParsed.dir + "/" + entryPointPathParsed.name + ".smooshed.js";
    console.log("output file will be set to: " + output);
}

var outputStat;
try {
    outputStat = fs.statSync(output);

    if (outputStat.isFile()){
        console.log("the output file at " + output + " already exists, will try to overwrite it");
    }

    if (outputStat.isDirectory()){
        var outputDir = output + (output.substr(output.length - 1) === "/" ? "" : "/");
        output = outputDir + entryPointPathParsed.base;
        console.log("the output file at " + outputDir + " is a directory, output will be set to " + output);
    }
} catch (e){
    // do nothing because the file doesn't exist yet
}

if (testTag){
    console.log("test tag was found, exiting now");
    process.exit(0);
}

// TODO: write dependency tree builder
var pie = {};
function recurseForDependencies(fileLocation){
    var resolvedFileLocation = path.resolve(fileLocation);
    if (pie.hasOwnProperty(resolvedFileLocation)){
        return;
    }
    console.log("Find dependencies in " + resolvedFileLocation);
    var piece = {
        id: resolvedFileLocation,
        src: fs.readFileSync(resolvedFileLocation, "utf8"),
        info: path.parse(resolvedFileLocation),
        dependencies: []
    };
    pie[resolvedFileLocation] = piece;

    var requireRegex = /require\("(.*)"\)/g;
    var match;
    while (match = requireRegex.exec(piece.src)) {
        var m = path.resolve(piece.info.dir + "/" + match[1]);
        if (piece.dependencies.indexOf(m) < 0) piece.dependencies.push(m);
    }

    piece.dependencies.forEach(function(dependency){
        recurseForDependencies(dependency);
    });
}
recurseForDependencies(entryPoint);
// TODO: write wrapper functions for amd and commonjs

console.log(JSON.stringify(pie, undefined, 4));
// TODO: figure out how to handle local vs 3rd party dependencies

