module.exports = function (grunt) {
    var pkg = grunt.file.readJSON("package.json");
    grunt.initConfig({
        pkg: pkg,
        jshint: {
            all: ["**.js", "test/**.js"]
        },
        mochacli: {
            all: {
                src: ["test/unit"]
            },
            options: {
                reporter: 'spec'
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-mocha-cli");

    grunt.registerTask("test", ["mochacli"]);

    return grunt.registerTask("default", ["jshint", "test"]);
};