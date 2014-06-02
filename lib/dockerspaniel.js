var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var mkdirp = require('mkdirp');
var habitat = require('habitat');
var Handlebars = require('handlebars');
var defaults = require('../defaults.json');


// the module
var ds;
module.exports = ds = {};


ds.generateContents = function(spaniel, tags, callback, root_dir) {
    process.nextTick(function(){

        if (!spaniel.from) {
            callback('\'from\' attribute does not exist.');
            return;
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

        var num_steps = spaniel.steps ? spaniel.steps.length : 0;

        var step = undefined;
        var i, j, skip, fc, caller_dir, template;
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
                if (skip) {
                    continue;
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
                    continue;
                }
            }

            contents += '\n';

            if (step.comment || step.newline) {
                contents += '\n';
            }

            if (step.comment) {
                contents += '# '+step.comment+'\n';
            }

            if (step.file) {
                try {
                    caller_dir = root_dir || path.dirname(module.parent.filename);
                    fc = fs.readFileSync(path.resolve(caller_dir, step.file), 'utf8');
                    template = Handlebars.compile(fc);
                    contents += template(data).trim();
                }
                catch (e) {
                    callback(e);
                    return;
                }
            }
            else {
                contents += step.instruction.toUpperCase()+' ';
                
                try {
                    template = Handlebars.compile(step.arguments);
                    contents += template(data);
                }
                catch (e) {
                    callback(e);
                    return;
                }
            }
        }

        callback(null, contents);
        return;
    });
};


ds.createDockerfile = function(opts, callback) {
    process.nextTick(function(){

        var input = opts.input || defaults.input_file;
        var output = opts.output || defaults.output_file;
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

            ds.generateContents(spaniel, tags, function(err, contents) {
                if (err) {
                    callback('Could not generate contents: '+err);
                    return;
                }
                
                var new_dir = path.dirname(output);

                mkdirp(new_dir, function (err) {
                    if (err) {
                        callback('Could not create directory '+new_dir+': '+err);
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
            }, path.dirname(input));
        });
    });
};
