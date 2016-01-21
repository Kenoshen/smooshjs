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
    var silentTag = false;
    var entryPoint;
    var output;
    var ret;

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
        } else if (arg === "--silent" || arg === "-silent") {
            silentTag = true;
        } else if (!entryPoint) {
            entryPoint = arg;
        } else {
            output = arg;
        }
    }

    if (helpTag) {
        if (!silentTag) console.log(getSnippet("help.txt"));
        return {code: 0, output: "help"};
    }
    if (!entryPoint) {
        if (!silentTag) console.error(getSnippet("help.txt"));
        return {code: 1, output: "missing entry point: " + args};
    }
    if (entryPoint.indexOf(".js") < 0) {
        ret = {code:1, output: "entry point must be a javascript file (end in .js)"};
        if (!silentTag) console.error(ret.output);
        return ret;
    }

    if (!amdTag && !cjsTag) {
        ret = {code:1, output: "must provide at least one of the output tags (-amd  OR  -cjs)"};
        if (!silentTag) console.error(ret.output);
        return ret;
    }

    var entryPointStat;
    try {
        entryPointStat = fs.statSync(entryPoint);
    } catch (e) {
        ret = {code:1, output: "file at " + entryPoint + " does not exist"};
        if (!silentTag) console.error(ret.output);
        return ret;
    }
    var entryPointPathParsed = path.parse(entryPoint);

    if (entryPointStat.isDirectory()) {
        ret = {code:1, output: "file at " + entryPoint + " is a directory"};
        if (!silentTag) console.error(ret.output);
        return ret;
    }

    if (!output) {
        output = entryPointPathParsed.dir + "/" + entryPointPathParsed.name + ".smooshed.js";
        if (!silentTag) console.log("output file will be set to: " + output);
    }

    var outputStat;
    try {
        outputStat = fs.statSync(output);

        if (outputStat.isFile()) {
            if (!silentTag) console.log("the output file at " + output + " already exists, will try to overwrite it");
        }

        if (outputStat.isDirectory()) {
            var outputDir = output + (output.substr(output.length - 1) === "/" ? "" : "/");
            output = outputDir + entryPointPathParsed.base;
            if (!silentTag) console.log("the output file at " + outputDir + " is a directory, output will be set to " + output);
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
            if (!silentTag) console.log("the output file at " + outputDir + " is a directory, output will be set to " + output);
        }
        try{
            fs.statSync(dirToMake);
        } catch (e2) {
            var madeDir = mkdirp.sync(dirToMake);
            if (!madeDir) {
                ret = {code: 1, output: "wasn't able to create the directory structure: " + dirToMake};
                if (!silentTag) console.error(ret.output);
                return ret;
            }
        }
    }

    if (amdTag && cjsTag) {
        var noJs = output.split(".js")[0];
        amdTag = noJs + ".amd.js";
        cjsTag = noJs + ".cjs.js";
        if (!silentTag) console.log("Both -amd and -cjs tags were provided, output will be sent to: " + amdTag + " and " + cjsTag);
    } else if (amdTag) {
        amdTag = output;
    } else if (cjsTag) {
        cjsTag = output;
    }

    if (testTag) {
        ret = {code:0, output: "test tag was found, exiting now"};
        if (!silentTag) console.log(ret.output);
        return ret;
    }

    var pie = {};

    function stringHash(str) {
        var hash = 0, i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return "" + Math.abs(hash);
    }

    function recurseForDependencies(fileLocation) {
        try {
            var resolvedFileLocation = path.resolve(fileLocation);
            if (pie.hasOwnProperty(resolvedFileLocation)) {
                return;
            }
            //if (!silentTag) console.log("Find dependencies in " + resolvedFileLocation);
            var piece = {
                id: stringHash(resolvedFileLocation),
                src: fs.readFileSync(resolvedFileLocation, "utf8"),
                info: path.parse(resolvedFileLocation),
                dependencies: []
            };
            pie[piece.id] = piece;

            var requireRegex = /require\("(.*)"\)/g;
            piece.src = piece.src.replace(requireRegex, function (p1, p2) {
                var m = path.resolve(piece.info.dir + "/" + p2);
                if (piece.dependencies.indexOf(m) < 0) piece.dependencies.push(m);
                return "require(\"" + stringHash(m) + "\")";
            });

            piece.dependencies.forEach(function (dependency) {
                recurseForDependencies(dependency);
            });
        } catch (e) {
            //if (!silentTag) console.log("Error during dependency search: " + e);
        }
    }

    recurseForDependencies(entryPoint);

    var cjsModuleTemplate = getSnippet("cjs.module.jstemplate");
    var entryPointId = stringHash(path.resolve(entryPoint));
    var sourceCompiled = "";
    for (var id in pie) {
        sourceCompiled += cjsModuleTemplate.replace("<%id>", id).replace("<%src>", pie[id].src);
    }
    if (cjsTag) {
        var cjsTemplate = getSnippet("cjs.jstemplate");
        fs.writeFileSync(cjsTag, cjsTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
        if (!silentTag) console.log("Successfully wrote to file: " + cjsTag);
    }
    if (amdTag) {
        var amdTemplate = getSnippet("amd.jstemplate");
        fs.writeFileSync(amdTag, amdTemplate.replace("<%source>", sourceCompiled).replace("<%entryPoint>", entryPointId), "utf8");
        if (!silentTag) console.log("Successfully wrote to file: " + amdTag);
    }

    return {code: 0, output: "Successfully wrote to: " + (cjsTag ? cjsTag : "") + " " + (amdTag ? amdTag : "")};
};
if (!module.parent) {
    var result = module.exports();
    process.exit(result.code);
}