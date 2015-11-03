var smoosh = require("../index.js");
var shell = require("shelljs");
var chai = require("chai");

describe("Require", function () {
    it("should be able to be used within a node run environment, not just as a shell script", function () {
        shell.exec("rm -r test/output/*");

        var output = smoosh("-cjs test/resources/cjs.entrypoint.js test/output/");
        chai.expect(output.code).to.equal(0);
        chai.expect(output.output).to.contain("Success");

        var product = require("./output/cjs.entrypoint.js");
        //var product = require("./output/test.js");
        console.log(JSON.stringify(product));

        chai.expect(product.thing).to.equal(1);
        chai.expect(product.dep1.add(1, 2)).to.equal(3);
        chai.expect(product.dep1.sub(1, 2)).to.equal(-1);
        chai.expect(product.dep2.sub(2, 2)).to.equal(0);
        chai.expect(product.dep2.add).to.equal(undefined);
    });

    it("should be able to handle spaces in the argument list", function () {
        shell.exec("rm -r test/output/*");

        var output = smoosh("    -cjs  test/resources/cjs.entrypoint.js    test/output/");
        chai.expect(output.code).to.equal(0);
        chai.expect(output.output).to.contain("Success");
    });

    it("should be able to handle an output folder that doesn't exist", function () {
        shell.exec("rm -r test/output/*");

        var output = smoosh("-cjs -amd test/resources/cjs.entrypoint.js test/output/does/not/exist/");
        chai.expect(output.code).to.equal(0);
        chai.expect(output.output).to.contain("Success");

        shell.exec("rm -r test/output/*");

        output = smoosh("-cjs test/resources/cjs.entrypoint.js test/output/does/not/exist");
        chai.expect(output.code).to.equal(0);
        chai.expect(output.output).to.contain("Success");
    });

    it("should be able to handle an output folder and file that doesn't exist", function () {
        shell.exec("rm -r test/output/*");

        var output = smoosh("-cjs -amd test/resources/cjs.entrypoint.js test/output/does/not/exist.js");
        chai.expect(output.code).to.equal(0);
        chai.expect(output.output).to.contain("Success");
    });
});