#!/usr/bin/env node

var ds = require('../lib/dockerspaniel.js');
var defaults = require('../defaults.json');


// parse command line options
var argv = require('yargs')
    .usage(
        'dockerspaniel -i [input] -o [output] -b [base image] -t [tag]\n'+
        '-i | --input    JSON file to use for input (default: Spanielfile)\n'+
        '-o | --output   Path of new Dockerfile to create (default: Dockerfile)\n'+
        '-b | --base     Override Docker base image to use in FROM instruction\n'+
        '-t | --tag      Tag(s) to prevent or include items based on \'unless\' and \'only\'')
    .alias('t','tag')
    .alias('b','base')
    .alias('i','input')
    .alias('o','output')
    .argv;


var main = function () {
    
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
