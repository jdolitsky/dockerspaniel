#!/usr/bin/env node

var ds = require('../lib/dockerspaniel.js');
var defaults = require('../defaults.json');


var usage = 
    '\n  Usage: dockerspaniel -i [input] -o [output] -b [baseimage] -t [tag]\n\n'+
    '  -h|--help    This help screen\n'+
    '  -i|--input   JSON file to use for input (default: Spanielfile)\n'+
    '  -o|--output  Path of new Dockerfile to create (default: Dockerfile)\n'+
    '  -b|--base    Override Docker base image to use in FROM instruction\n'+
    '  -t|--tag     Tag(s) for use by \'unless\' and \'only\' step attributes\n'+
    '               Supports mutliple tags via format \'-t tag1 -t tag2\' etc.\n';


// parse command line options
var argv = require('yargs')
    .alias('t','tag')
    .alias('b','base')
    .alias('i','input')
    .alias('o','output')
    .alias('h','help')
    .argv;


// the module
var ds_cli;
module.exports = ds_cli = {};


ds_cli.run = function (opts, callback) {
    process.nextTick(function() {

        if (opts.help) {
            callback({
                message: usage,
                code: 0
            });
            return;
        }
        
        var options = {
            input: opts.input,
            output: opts.output || defaults.output_file,
            tags: opts.tag,
            base: opts.base
        };

        ds.createDockerfile(options, function (err) {
            if (err) {
                callback({
                    message: 'Error creating '+options.output+'.\n'+err,
                    code: 1
                });
                return;
            }

            callback({
                message: 'Successfully created '+options.output+'.',
                code: 0
            });
            return;
        });
    });
};


var handleResult = function(r) { 
    console.log(r.message); 
    process.exit(r.code);
};


var main = function() {
    ds_cli.run(argv, handleResult);
};


if (require.main === module) {
    main();
}
