
"<%id>": function(){
    var module = {exports: {}};
    var hasBeenRun = false;
    var f = function(module, exports){
        <%src>
    };
    return {
        get: function(){
            if (! hasBeenRun){
                f(module, module.exports);
                hasBeenRun = true;
            }
            return module.exports;
        }
    }
}(),
