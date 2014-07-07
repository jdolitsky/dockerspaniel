var fs = require('fs');
var path = require('path');
var async = require('async');


var defaults = require('../defaults.json');
var utils = require('./utils.js');
var A = utils.forceAsync;


// the module
var ds;
module.exports = ds = {};


ds.generateContents = A(function(spaniel, tags, callback, is_child, root_dir) {

    var contents = [];

    if (!is_child && !spaniel.from) {
        return callback('\'from\' attribute does not exist.');
    }

    if (spaniel.from) {
        contents.push('FROM ' + spaniel.from);
    }

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

    if (spaniel.maintainer) {
        contents.push('MAINTAINER ' + spaniel.maintainer);
    }
    
    if (!spaniel.steps) {
        return callback(null, contents.join('\n'));
    }
    
    var data = utils.clone(spaniel.defaults);

    // get all env vars prefixed with "DS_"
    var env_data = utils.getDsEnv();

    // override spaniel.defaults with env vars
    for (var key in env_data) {
        if( env_data.hasOwnProperty( key ) ) {
            data[key] = env_data[key];
        } 
    }

    var j, skip, fc, external, caller_dir, ext_abs_path, template;

    async.eachSeries(spaniel.steps, function(step, done) {

        // if tag in 'unless' array is present, do not make step
        if (step.unless && step.unless.length) {
            skip = false;
            for (j=0; j<step.unless.length; j++) {
                if (tag_obj[step.unless[j]]) {
                    skip = true;
                    break;
                }
            }
            if (skip) {
                return done();
            }
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
            if (skip) {
                return done();
            }
        }


        if (step.comment || step.newline) {
            contents.push('');
        }

        if (step.comment) {
            contents.push('# '+step.comment);
        }

        external = step.file || step.include;
        if (external) {
            caller_dir = root_dir || path.dirname(module.parent.filename);
            ext_abs_path = path.resolve(caller_dir, external);
        }

        if (step.file) {
            fs.readFile(ext_abs_path, 'utf8', function(err, fc) {
                if (err) {
                    return done(err);
                }

                utils.compileTemplate(fc, data, function(err, ct) {
                    if (err) {
                        return done(err);
                    }

                    contents.push(ct);
                    return done();
                });
            });
        }
        else if (step.include) {
            utils.parseJsonFile(ext_abs_path, function(err, s) {
                if (err) {
                    return done(err);
                }

                if (!s.defaults) {
                    s.defaults = data;
                }
                else {

                    // pass defaults down to include
                    for (var key in data) {
                        if( data.hasOwnProperty( key ) ) {
                            if (!s.defaults[key]) {
                                s.defaults[key] = data[key];
                            }
                        } 
                    }
                }

                ds.generateContents(s, tags, function(err, c) {
                    if (err) {
                        return done(err);
                    }

                    contents.push(c);
                    return done();
                }, true);
            });
        }
        else {
            utils.compileTemplate(step.arguments, data, function(err, ct) {
                if (err) {
                    return done(err);
                }

                contents.push(step.instruction.toUpperCase()+' '+ct);
                return done();
            });
        }

    }, function(err) {
        if (err) {
            return callback(err);
        }

        return callback(null, contents.join('\n'));
    });
});


ds.createDockerfile = A(function(opts, callback) {

    var input = opts.input || defaults.input_file;
    var output = opts.output || defaults.output_file;
    var tags = opts.tags || null; 
        
    utils.parseJsonFile(input, function(err, spaniel) {
        if (err) {
            return callback(err);
        }

        spaniel.from = opts.base || spaniel.from;

        ds.generateContents(spaniel, tags, function(err, contents) {
            if (err) {
                return callback('Could not generate contents: '+err);
            }

            utils.writeToFile(contents, output, function(err) {
                if (err) {
                    return callback('Could not write to '+output+': '+err);
                }

                return callback(null);
            }); 

        }, false, path.dirname(input));
    });
});
