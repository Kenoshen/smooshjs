#! /usr/bin/env node

module.exports = function(stringArgs) {
    var args;
    if (stringArgs) {
        args = stringArgs.split(" ");
    } else {
        args = process.argv.splice(2);
    }

    var fs = require("fs");
    var path = require("path");

    function getSnippet(name) { return fs.readFileSync(__dirname + "/snippets/" + name, "utf8"); }

    var helpTag = false;
    var amdTag = false;
    var cjsTag = false;
    var testTag = false;
    var entryPoint = undefined;
    var output = undefined;

    for (var i = 0; i < args.length; i++) {
        if (args[i] === null || args[i] === undefined){
            continue;
        }
        var arg = args[i].trim();
        if (arg === ""){
            continue;
        } else if (arg === "--help" || arg === "-help") {
            helpTag = true;
        } else if (arg === "--amd" || arg === "-amd") {
            amdTag = true;
        } else if (arg === "--cjs" || arg === "-cjs") {
            cjsTag = true;
        } else if (arg === "--test" || arg === "-test") {
            testTag = true;
        } else if (!entryPoint) {
            entryPoint = arg;
        } else {
            output = arg;
        }
    }

    if (helpTag) {
        console.log(getSnippet("help.txt"));
        return {code: 0, output: "help"};
    }
    if (!entryPoint) {
        console.error(getSnippet("help.txt"));
        return {code: 1, output: "missing entry point: " + args};
    }
    if (entryPoint.indexOf(".js") < 0) {
        var ret = {code:1, output: "entry point must be a javascript file (end in .js)"};
        console.error(ret.output);
        return ret;
    }

    if (!amdTag && !cjsTag) {
        var ret = {code:1, output: "must provide at least one of the output tags (-amd  OR  -cjs)"};
        console.error(ret.output);
        return ret;
    }

    var entryPointStat;
    try {
        entryPointStat = fs.statSync(entryPoint);
    } catch (e) {
        var ret = {code:1, output: "file at " + entryPoint + " does not exist"};
        console.error(ret.output);
        return ret;
    }
    var entryPointPathParsed = path.parse(entryPoint);

    if (entryPointStat.isDirectory()) {
        var ret = {code:1, output: "file at " + entryPoint + " is a directory"};
        console.error(ret.output);
        return ret;
    }

    if (!output) {
        output = entryPointPathParsed.dir + "/" + entryPointPathParsed.name + ".smooshed.js";
        console.log("output file will be set to: " + output);
    }

    var outputStat;
    try {
        outputStat = fs.statSync(output);

        if (outputStat.isFile()) {
            console.log("the output file at " + output + " already exists, will try to overwrite it");
        }

        if (outputStat.isDirectory()) {
            var outputDir = output + (output.substr(output.length - 1) === "/" ? "" : "/");
            output = outputDir + entryPointPathParsed.base;
            console.log("the output file at " + outputDir + " is a directory, output will be set to " + output);
        }
    } catch (e) {
        // if the location doesn't exist, make sure that all the folders up to that location exist
        var mkdirp = require("mkdirp");
        var outputPath = path.parse(output);
        var dirToMake = outputPath.dir;
        if (! outputPath.ext){
            dirToMake = output;

            var outputDir = output + (output.substr(output.length - 1) === "/" ? "" : "/");
            output = outputDir + entryPointPathParsed.base;
            console.log("the output file at " + outputDir + " is a directory, output will be set to " + output);
        }
        var madeDir = mkdirp.sync(dirToMake);
        if (!madeDir){
            var ret = {code:1, output: "wasn't able to create the directory structure: " + dirToMake};
            console.error(ret.output);
            return ret;
        }
    }

    if (amdTag && cjsTag) {
        var noJs = output.split(".js")[0];
        amdTag = noJs + ".amd.js";
        cjsTag = noJs + ".cjs.js";
        console.log("Both -amd and -cjs tags were provided, output will be sent to: " + amdTag + " and " + cjsTag);
    } else if (amdTag) {
        amdTag = output
    } else if (cjsTag) {
        cjsTag = output
    }

    if (testTag) {
        var ret = {code:0, output: "test tag was found, exiting now"};
        console.log(ret.output);
        return ret;
    }

    var pie = {};

    function recurseForDependencies(fileLocation) {
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
        } catch (e) {
            //console.log("Error during dependency search: " + e);
        }
    }

    recurseForDependencies(entryPoint);

    var cjsModuleTemplate = getSnippet("cjs.module.jstemplate");
    var entryPointId = path.resolve(entryPoint);
    var sourceCompiled = "";
    for (var id in pie) {
        sourceCompiled += cjsModuleTemplate.replace("<%id>", id).replace("<%src>", pie[id].src);
    }
    if (cjsTag) {
        var cjsTemplate = getSnippet("cjs.jstemplate");
        fs.writeFileSync(cjsTag, cjsTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
        console.log("Successfully wrote to file: " + cjsTag);
    }
    if (amdTag) {
        var amdTemplate = getSnippet("amd.jstemplate");
        fs.writeFileSync(amdTag, amdTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
        console.log("Successfully wrote to file: " + amdTag);
    }

    return {code: 0, output: "Successfully wrote to: " + (cjsTag ? cjsTag : "") + " " + (amdTag ? amdTag : "")};
};
if (!module.parent) {
    var result = module.exports()
    process.exit(result.code);
}