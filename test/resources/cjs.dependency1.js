var req = require("cjs.dependency2.js");

module.exports = {
    add: function(a, b){ return a + b; },
    sub: req.sub
};