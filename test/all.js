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
                ds.generateContents({}, null, function(err, contents) {
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
            
            it('accepts single tag as string', function(done) {
                tags = 'nodejs';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal(
                        'FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get update\nRUN apt-get install -y nodejs');
                    done();
                });
            })
            
            it('generates contents correctly, no \'maintainer\'', function(done) {
                tags = null;
                spaniel.from = 'ubuntu:12.04';
                delete spaniel.maintainer;
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update');
                    done();
                });
            })
            
            it('requires \'from\'', function(done) {
                tags = null;
                delete spaniel.from;
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.exist(err);
                    should.not.exist(contents);
                    done();
                });
            })
            
            it('generates contents correctly with step.newline', function(done) {
                tags = null;
                spaniel.from = 'ubuntu:12.04';
                spaniel.steps[0].newline = true;
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\n\nRUN apt-get update');
                    done();
                });
            })
            
            it('generates contents correctly with step.comment', function(done) {
                tags = null;
                spaniel.from = 'ubuntu:12.04';
                delete spaniel.steps[0].newline;
                spaniel.steps[0].comment = 'my comment';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\n\n# my comment\nRUN apt-get update');
                    done();
                });
            })
            
            it('replaces variables correctly', function(done) {
                tags = null;
                spaniel.from = 'ubuntu:12.04';
                delete spaniel.steps[0].comment;
                spaniel.defaults = {
                    ds_var_1: 'curl',
                    ds_var_2: 'wget'
                };
                spaniel.steps.push({
                    instruction: 'run',
                    arguments: 'apt-get install -y #{ds_var_1} #{ds_var_2}'
                });
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y curl wget');
                    done();
                });
            })
            
            it('prefers environment variables over defaults', function(done) {
                process.env['ds_var_1'] = 'screen';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y screen wget');
                    delete process.env['ds_var_1'];
                    done();
                });
            })
            
        })
        
        describe('createDockerfile() method', function() {
            it('exists', function() {
                ds.should.have.property('createDockerfile');
            })

            it('is asynchronous', function(done) {
                var str = '';
                ds.createDockerfile({}, function(err, contents) {
                    str += 'after';
                    str.should.equal('before->after');
                    done();
                });
                str += 'before->';
            })

            var options;
            
            it('creates a Dockerfile', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_valid',
                    output:  tmp + '/Dockerfile1' 
                };

                ds.createDockerfile(options, function(err, contents) {
                    fs.readFile(options.output, 'utf-8', function (err, data) {
                        should.not.exist(err);
                        data.should.not.be.empty;
                        (data.indexOf('FROM ')).should.not.equal(-1);
                        done();
                    });
                });
            })
            
            it('requires valid JSON', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_invalid'
                };

                ds.createDockerfile(options, function(err, contents) {
                    should.exist(err);
                    should.not.exist(contents);
                    done();
                });
            })
            
            it('requires \'from\'', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_no_from'
                };

                ds.createDockerfile(options, function(err, contents) {
                    should.exist(err);
                    should.not.exist(contents);
                    done();
                });
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
            it('exists', function() {
                ds_cli.should.have.property('run');
            })
            
            it('is asynchronous', function(done) {
                var str = '';
                ds_cli.run({}, function(result) {
                    str += 'after';
                    str.should.equal('before->after');
                    done();
                })
                str += 'before->';
            })

            it('returns usage if passed {help: true}', function(done) {
                ds_cli.run({help:true}, function(result) {
                    result.code.should.equal(0);
                    (result.message.indexOf('dockerspaniel ')).should.not.equal(-1);
                    done();
                })
            })

            var options;
            
            it('creates a Dockerfile', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_valid',
                    output:  tmp + '/Dockerfile2' 
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
            
            it('result.code is 1 if bad input', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_nonexistant',
                    output:  tmp + '/Dockerfile' 
                };

                ds_cli.run(options, function(result) {
                    result.code.should.equal(1);
                    done();
                })
            })
        })
    })
})
