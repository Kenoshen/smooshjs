var shell = require("shelljs");
var chai = require("chai");

describe("CJS", function(){
   it.only("should parse through the cjs-based file and find all the correct dependencies", function(){
       var output = shell.exec("smoosh -cjs test/resources/cjs.entrypoint.js test/output/");
   })
});