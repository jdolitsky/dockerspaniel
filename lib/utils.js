var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var async = require('async');
var mkdirp = require('mkdirp');
var habitat = require('habitat');
var Handlebars = require('handlebars');


// the module
var utils;
module.exports = utils = {};


utils.parseJsonFile = function(input, callback) {
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


utils.writeToFile = function(contents, output, callback) {

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
};


utils.compileTemplate = function(content, data, callback) {
    try {
        var template = Handlebars.compile(content, {noEscape: true});
        return callback(null, template(data).trim());
    }
    catch (e) {
        return callback(e);
    }
};


utils.clone = function(obj) {
    return extend({}, obj);
};


utils.getDsEnv = function() {
    var env = new habitat('ds');
    return env.all();
};
