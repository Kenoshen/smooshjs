var fs = require("fs");

function displayMessage(name){ console.log(fs.readFileSync(__dirname + "/messages/" + name + ".txt", "utf8")); }

var helpTag = false;
var amdTag = false;
var cjsTag = false;
var entryPoint = undefined;
var output = undefined;

for (var i = 2; i < process.argv.length; i++){
    var arg = process.argv[i];
    if (arg === "--help" || arg === "-help" || arg === "help"){
        helpTag = true;
    } else if (arg === "--amd" || arg === "-amd" || arg === "amd"){
        amdTag = true;
    } else if (arg === "--cjs" || arg === "-cjs" || arg === "cjs"){
        cjsTag = true;
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
if (!output){
    output = entryPoint.split(".js")[0] + ".smooshed.js";
    console.log("Output file will be set to: " + output);
}
if (!amd && !cjs){
    console.log("must provide at least one of the output tags (-amd  OR  -cjs)");
    process.exit(1);
}
if (amd && cjs){
    // TODO: figure out what to do when they want both
}

// TODO: check if entryPoint file exists
// TODO: write dependency tree builder
// TODO: write wrapper functions for amd and commonjs
// TODO: figure out how to handle local vs 3rd party dependencies

