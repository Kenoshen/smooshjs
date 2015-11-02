var shell = require("shelljs");
var chai = require("chai");

describe("CLI", function(){
    describe("Arguments", function(){
        it("should fail when no arguments are provided", function(){
            var ret = shell.exec("smoosh");
            chai.expect(ret.code).to.equal(1);
        });

        it("should fail when missing a -amd or -cjs option", function(){
            var ret = shell.exec("smoosh filename.js");
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.output).to.contain("amd");
            chai.expect(ret.output).to.contain("cjs");
        });

        it("should pass when the -help/--help option is given", function(){
            var ret = shell.exec("smoosh -help");
            chai.expect(ret.code).to.equal(0);
            ret = shell.exec("smoosh --help");
            chai.expect(ret.code).to.equal(0);
        });

        it("should fail when the entry point is missing a .js extension", function(){
            var ret = shell.exec("smoosh -amd filenameNoJS");
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.output).to.contain("must be a javascript file");
        });

        it("should default to *.smooshed.js when no output file is given", function(){
            var ret = shell.exec("smoosh -amd -test test/resources/entryPointThatExists.js");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.output).to.contain(".smooshed.js");
        });

        it("should pass but not run when the -test/--test option is set", function(){
            var ret = shell.exec("smoosh -amd -test test/resources/entryPointThatExists.js");
            chai.expect(ret.code).to.equal(0);
            ret = shell.exec("smoosh -amd --test test/resources/entryPointThatExists.js");
            chai.expect(ret.code).to.equal(0);
        });

        it("should fail when the entry point doesn't exist", function(){
            var ret = shell.exec("smoosh -amd filename.js");
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.output).to.contain("does not exist");
        });

        it("should fail when the entry point is a directory", function(){
            var ret = shell.exec("smoosh -amd test/resources/directory.js");
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.output).to.contain("is a directory");
        });

        it("should warn if the output file exists", function(){
            var ret = shell.exec("smoosh -amd -test test/resources/entryPointThatExists.js test/resources/entryPointThatExists.js");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.output).to.contain("already exists, will try to overwrite");
        });

        it("should pass but warn if the output file is a directory", function(){
            var ret = shell.exec("smoosh -amd -test test/resources/entryPointThatExists.js test/resources/directory.js");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.output).to.contain("is a directory, output will be set to");
        });
    });
});