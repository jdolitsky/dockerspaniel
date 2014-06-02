var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var async = require('async');
var mkdirp = require('mkdirp');
var habitat = require('habitat');
var Handlebars = require('handlebars');
var defaults = require('../defaults.json');


var openAndParse = function(input, callback) {
    fs.readFile(input, 'utf8', function (err, data) {
        if (err) {
            return callback('Could not read '+input+': '+err);
        }

        var spaniel = undefined;
        try {
            spaniel = JSON.parse(data);
        }
        catch (err) {
            return callback(input+' is not valid JSON: '+err);
        }

        return callback(null, spaniel);
    });
};


// the module
var ds;
module.exports = ds = {};


ds.generateContents = function(spaniel, tags, callback, root_dir) {
    process.nextTick(function(){

        if (!spaniel.from) {
            return callback('\'from\' attribute does not exist.');
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

        var contents = 'FROM ' + spaniel.from;

        if (spaniel.maintainer) {
            contents += '\nMAINTAINER ' + spaniel.maintainer;
        }
        
        var data = extend({}, spaniel.defaults);

        // get all env vars prefixed with "DS_"
        var env = new habitat('ds');
        var env_data = env.all();

        // override spaniel.defaults with env vars
        for (var key in env_data) {
            if( env_data.hasOwnProperty( key ) ) {
                data[key] = env_data[key];
            } 
        }

        if (!spaniel.steps) {
            return callback(null, contents);
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

            contents += '\n';

            if (step.comment || step.newline) {
                contents += '\n';
            }

            if (step.comment) {
                contents += '# '+step.comment+'\n';
            }

            external = step.file || step.include;
            if (external) {
                caller_dir = root_dir || path.dirname(module.parent.filename);
                ext_abs_path = path.resolve(caller_dir, external);
            }

            if (step.file) {
                try {
                    fc = fs.readFileSync(ext_abs_path, 'utf8');
                    template = Handlebars.compile(fc, {noEscape: true});
                    contents += template(data).trim();
                }
                catch (e) {
                    return done(e);
                }
                
                return done();
            }
            else if (step.include) {
                openAndParse(ext_abs_path, function(err, s) {
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
                                if (typeof s.defaults[key] === undefined) {
                                    s.defaults[key] = data[key];
                                }
                            } 
                        }
                    }

                    ds.generateContents(s, tags, function(err, c) {
                        contents += c;
                        return done();
                    });
                });
            }
            else {
                contents += step.instruction.toUpperCase()+' ';
                
                try {
                    template = Handlebars.compile(step.arguments, {noEscape: true});
                    contents += template(data);
                }
                catch (e) {
                    return done(e);
                }

                return done();
            }

        }, function(err) {
            if (err) {
                return callback(err);
            }

            return callback(null, contents);
        });
    });
};


ds.createDockerfile = function(opts, callback) {
    process.nextTick(function(){

        var input = opts.input || defaults.input_file;
        var output = opts.output || defaults.output_file;
        var tags = opts.tags || null; 
            
        openAndParse(input, function(err, spaniel) {
            if (err) {
                return callback(err);
            }

            spaniel.from = opts.base || spaniel.from;

            ds.generateContents(spaniel, tags, function(err, contents) {
                if (err) {
                    return callback('Could not generate contents: '+err);
                }
                
                var new_dir = path.dirname(output);

                mkdirp(new_dir, function (err) {
                    if (err) {
                        return callback('Could not create directory '+new_dir+': '+err);
                    }

                    fs.writeFile(output, contents, function(err) {
                        if (err) {
                            return callback('Could not write to '+output+': '+err);
                        }

                        return callback(null);
                    });
                }); 
            }, path.dirname(input));
        });
    });
};
