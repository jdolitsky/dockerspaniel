var fs = require('fs');
var should = require('should');

var dockerspaniel_defaults_path = __dirname + '/../defaults.json';
var dockerspaniel_module_path = __dirname + '/../lib/dockerspaniel.js';
var dockerspaniel_cli_path = __dirname + '/../bin/dockerspaniel-cli.js';
var tmp = __dirname + '/tmp';

describe('dockerspaniel', function() {
   
    var defaults; 

    describe('defaults', function() {
        it('can be required / is valid JSON', function() {
            (function() {
                defaults = require(dockerspaniel_defaults_path);
            }).should.not.throw ();
        })
    })
    
    var ds;

    describe('module', function() {
        it('can be required', function() {
            (function() {
                ds = require(dockerspaniel_module_path);
            }).should.not.throw ();
        })

        describe('generateContents() method', function() {
            it('exists', function() {
                ds.should.have.property('generateContents');
            })
            
            
            var spaniel = {
                from: 'ubuntu:12.04',
                maintainer: 'Joe Somebody',
                steps: [
                    {
                        instruction: 'run',
                        arguments: 'apt-get update',
                        unless: ['noupdate']
                    },
                    {
                        instruction: 'run',
                        arguments: 'apt-get install -y nodejs',
                        only: ['nodejs']
                    }
                ]
            };

            var tags = [];
            
            it('is asynchronous', function(done) {
                var str = '';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    str += 'after';
                    str.should.equal('before->after');
                    done();
                });
                str += 'before->';
            })

            it('generates contents correctly', function(done) {
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get update');
                    done();
                });
            })
            
            it('generates contents correctly with tags', function(done) {
                tags = ['noupdate', 'nodejs'];
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get install -y nodejs');
                    done();
                });
            })
        })
        
        describe('createDockerfile() method', function() {
            it('exists', function() {
                ds.should.have.property('createDockerfile');
            })
        })

    })

    var ds_cli;

    describe('cli', function() {
        
        it('can be required', function() {
            (function() {
                ds_cli = require(dockerspaniel_cli_path);
            }).should.not.throw ();
        })

        describe('run() method', function() {

            it('returns usage if passed {help: true}', function(done) {
                ds_cli.run({help:true}, function(result) {
                    result.code.should.equal(0);
                    (result.message.indexOf('dockerspaniel ')).should.not.equal(-1);
                    done();
                })
            })
            
            it('creates a Dockerfile', function(done) {
                var options = {
                    input:  __dirname + '/data/Spanielfile',
                    output:  tmp + '/Dockerfile' 
                };

                ds_cli.run(options, function(result) {
                    result.code.should.equal(0);

                    fs.readFile(options.output, 'utf-8', function (err, data) {
                        should.not.exist(err);
                        data.should.not.be.empty;
                        (data.indexOf('FROM ')).should.not.equal(-1);
                        done();
                    });
                })
            })
        })
    })
})
