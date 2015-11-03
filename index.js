#! /usr/bin/env node

var fs = require("fs");
var path = require("path");

function displayMessage(name){ console.log(fs.readFileSync(__dirname + "/snippets/" + name + ".txt", "utf8")); }

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
    console.error("entry point must be a javascript file (end in .js)");
    process.exit(1);
}

if (!amdTag && !cjsTag){
    console.error("must provide at least one of the output tags (-amd  OR  -cjs)");
    process.exit(1);
}

// TODO: check if entryPoint file exists
var entryPointStat;
try {
    entryPointStat = fs.statSync(entryPoint);
} catch (e){
    console.error("file at " + entryPoint + " does not exist");
    process.exit(1);
}
var entryPointPathParsed = path.parse(entryPoint);

if (entryPointStat.isDirectory()){
    console.error("file at " + entryPoint + " is a directory");
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

if (amdTag && cjsTag){
    var noJs = output.split(".js")[0];
    amdTag = noJs + ".amd.js";
    cjsTag = noJs + ".cjs.js";
    console.log("Both -amd and -cjs tags were provided, output will be sent to: " + amdTag + " and " + cjsTag);
} else if (amdTag){
    amdTag = output
} else if (cjsTag){
    cjsTag = output
}

if (testTag){
    console.log("test tag was found, exiting now");
    process.exit(0);
}

var pie = {};
function recurseForDependencies(fileLocation){
    try {
        var resolvedFileLocation = path.resolve(fileLocation);
        if (pie.hasOwnProperty(resolvedFileLocation)) {
            return;
        }
        //console.log("Find dependencies in " + resolvedFileLocation);
        var piece = {
            id: resolvedFileLocation,
            src: fs.readFileSync(resolvedFileLocation, "utf8"),
            info: path.parse(resolvedFileLocation),
            dependencies: []
        };
        pie[resolvedFileLocation] = piece;

        var requireRegex = /require\("(.*)"\)/g;
        piece.src = piece.src.replace(requireRegex, function (p1, p2) {
            var m = path.resolve(piece.info.dir + "/" + p2);
            if (piece.dependencies.indexOf(m) < 0) piece.dependencies.push(m);
            return "require(\"" + m + "\")";
        });

        piece.dependencies.forEach(function (dependency) {
            recurseForDependencies(dependency);
        });
    }catch (e){
        //console.log("Error during dependency search: " + e);
    }
}
recurseForDependencies(entryPoint);

var cjsModuleTemplate = fs.readFileSync(__dirname + "/snippets/cjs.module.jstemplate", "utf8");
var entryPointId = path.resolve(entryPoint);
var sourceCompiled = "";
for (var id in pie){
    sourceCompiled += cjsModuleTemplate.replace("<%id>", id).replace("<%src>", pie[id].src);
}
if (cjsTag){
    var cjsTemplate = fs.readFileSync(__dirname + "/snippets/cjs.jstemplate", "utf8");
    fs.writeFileSync(cjsTag, cjsTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
    console.log("Successfully wrote to file: " + cjsTag);
}
if (amdTag){
    var amdTemplate = fs.readFileSync(__dirname + "/snippets/amd.jstemplate", "utf8");
    fs.writeFileSync(amdTag, amdTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
    console.log("Successfully wrote to file: " + amdTag);
}

process.exit(0);