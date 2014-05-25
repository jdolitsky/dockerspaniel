#!/usr/bin/env node

var fs = require('fs');

var defaults = {
    spaniel_file: 'Spanielfile',
    docker_file: 'Dockerfile'
};

// the module
var m = {};

m.generateContents = function(spaniel, tags, callback) {
    process.nextTick(function(){
        var tag_obj = {};
        if (tags && tags.length) {
            if (typeof tags === 'string'){
                tag_obj[tags]=true;
            }
            else {
                for (var i=0;i<tags.length; i++) {
                    tag_obj[tags[i]]=true;
                }
            }
        }

        var contents = 'FROM '+spaniel.from+'\n';

        if (spaniel.maintainer) {
            contents += 'MAINTAINER '+spaniel.maintainer+'\n'; 
        }

        var num_steps = spaniel.steps.length;
        var step = undefined;
        var i, j, skip;
        for (i = 0; i < num_steps; i++) {
            step = spaniel.steps[i];

            // if tag in 'unless' array is present, do not make step
            if (step.unless && step.unless.length) {
                skip = false;
                for (j=0; j<step.unless.length; j++) {
                    if (tag_obj[step.unless[j]]) {
                        skip = true;
                        break;
                    }
                }
                if (skip) { continue; }
            }
            
            // only make step if tag in 'only' array is present
            if (step.only && step.only.length) {
                skip = false;
                for (j=0; j<step.only.length; j++) {
                    if (!tag_obj[step.only[j]]) {
                        skip = true;
                        break;
                    }
                }
                if (skip) { continue; }
            }

            if (step.comment || step.newline) { contents += '\n'; }
            if (step.comment) { contents += '# '+step.comment+'\n'; }
            contents += step.instruction.toUpperCase()+' ';
            contents += step.arguments+'\n';
        }

        callback(null, contents);
        return;
    });
};

m.createDockerfile = function(opts, callback) {
    process.nextTick(function(){

        var input = opts.input || defaults.spaniel_file;
        var output = opts.output || defaults.docker_file;
        var tags = opts.tags || null; 

        fs.readFile(input, 'utf8', function (err, data) {
            if (err) {
                callback('Could not read '+input+': '+err);
                return;
            }

            var spaniel = undefined;
            try {
                spaniel = JSON.parse(data);
            }
            catch (err) {
                callback(input+' is not valid JSON: '+err);
                return;
            }

            spaniel.from = opts.base || spaniel.from;

            m.generateContents(spaniel, tags, function(err, contents) {
                if (err) {
                    callback('Could not generate contents: '+err);
                    return;
                }
                
                fs.writeFile(output, contents, function(err) {
                    if (err) {
                        callback('Could not write to '+output+': '+err);
                        return;
                    }

                    callback(null);
                    return;
                });
            });
        });
    });
};

var main = function () {
    var argv = require('yargs')
        .default('t',undefined)
            .alias('t','tag')
        .default('b',undefined)
            .alias('b','base')
        .default('i',undefined)
            .alias('i','input')
        .default('o',undefined)
            .alias('o','output')
        .argv;

    var output = argv.o || defaults.docker_file;

    var options = {
        input: argv.i,
        output: output,
        tags: argv.t,
        base: argv.b
    };

    m.createDockerfile(options, function (err) {
        if (err) {
            console.log('Error creating '+output+'.');
            console.log(err);
            process.exit(1);
        }
        console.log('Successfully created '+output+'.');
        process.exit(0);
    });
};

// if being run from command line...
if (require.main === module) {
    main();
}
else {
    module.exports = m;
}
