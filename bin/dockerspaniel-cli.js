#!/usr/bin/env node

var yargs = require('yargs');
var ds = require('../lib/dockerspaniel.js');
var defaults = require('../defaults.json');


// parse command line options
var argv = yargs
    .usage(
        '\n  Usage: dockerspaniel -i [input] -o [output] -b [baseimage] -t [tag]\n\n'+
        '  -h|--help    This help screen\n'+
        '  -i|--input   JSON file to use for input (default: Spanielfile)\n'+
        '  -o|--output  Path of new Dockerfile to create (default: Dockerfile)\n'+
        '  -b|--base    Override Docker base image to use in FROM instruction\n'+
        '  -t|--tag     Tag(s) for use by \'unless\' and \'only\' step attributes\n'+
        '               Supports mutliple tags via format \'-t tag1 -t tag2\' etc.')
    .alias('t','tag')
    .alias('b','base')
    .alias('i','input')
    .alias('o','output')
    .alias('h','help')
    .argv;


var main = function () {

    if (argv.h) {
        yargs.showHelp();
        process.exit(0);
    }
    
    var options = {
        input: argv.i,
        output: argv.o || defaults.output_file,
        tags: argv.t,
        base: argv.b
    };

    ds.createDockerfile(options, function (err) {
        if (err) {
            console.log('Error creating '+options.output+'.');
            console.log(err);
            process.exit(1);
        }
        console.log('Successfully created '+options.output+'.');
        process.exit(0);
    });
};


main();
