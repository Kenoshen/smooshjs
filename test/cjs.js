var shell = require("shelljs");
var chai = require("chai");

describe("CJS", function(){
   it.only("should parse through the cjs-based file and find all the correct dependencies", function(){
       //shell.exec("smoosh -cjs test/resources/cjs.entrypoint.js test/output/");
       shell.exec("smoosh -cjs test/resources/cjs.entrypoint.js test/output/");
       var product = require("./output/cjs.entrypoint.js")();
       //var product = require("./output/test.js");
       console.log(JSON.stringify(product));

       chai.expect(product.thing).to.equal(1);
       chai.expect(product.dep1.add(1, 2)).to.equal(3);
       chai.expect(product.dep1.sub(1, 2)).to.equal(-1);
       chai.expect(product.dep2.sub(2, 2)).to.equal(0);
       chai.expect(product.dep2.add).to.equal(undefined);
   })
});