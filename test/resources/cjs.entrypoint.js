module.exports = function(){
    dependency1 = require("cjs.dependency1.js");
    dependency2 = require("cjs.dependency2.js");
    dependency2Again = require("cjs.dependency2.js");
    return {
        thing: 1,
        dep1: dependency1,
        dep2: dependency2
    };
};