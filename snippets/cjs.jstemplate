module.exports = function(){
    var source;
    var require;
    var originalRequire = require;
    function require(name){
        if (source[name]){
            return source[name].get()
        } else {
            return originalRequire(name);
        }
    }

    source={
        <%source>
    };

    return source["<%entryPoint>"].get()
}();