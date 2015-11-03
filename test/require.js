var smoosh = require("../index.js");
var shell = require("shelljs");
var chai = require("chai");

describe("Require", function(){
   it("should be able to be used within a node run environment, not just as a shell script", function(){
       shell.exec("rm -r test/output/*");

       smoosh("-cjs", "test/resources/cjs.entrypoint.js", "test/output/");

       var product = require("./output/cjs.entrypoint.js");
       //var product = require("./output/test.js");
       console.log(JSON.stringify(product));

       chai.expect(product.thing).to.equal(1);
       chai.expect(product.dep1.add(1, 2)).to.equal(3);
       chai.expect(product.dep1.sub(1, 2)).to.equal(-1);
       chai.expect(product.dep2.sub(2, 2)).to.equal(0);
       chai.expect(product.dep2.add).to.equal(undefined);
   })
});