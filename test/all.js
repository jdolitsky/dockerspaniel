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
                        unless_one: ['noupdate', 'echo_a']
                    },
                    {
                        instruction: 'run',
                        arguments: 'apt-get install -y nodejs',
                        only_one: ['nodejs', 'echo_a']
                    },
                    {
                        instruction: 'run',
                        arguments: 'echo testing unless',
                        unless: ['echo_a', 'echo_b']
                    },
                    {
                        instruction: 'run',
                        arguments: 'echo testing only',
                        only: ['echo_a', 'echo_b']
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
                    contents.should.equal('FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get update\nRUN echo testing unless');
                    done();
                });
            })
            
            it('generates contents correctly with tags (unless_one, only_one)', function(done) {
                tags = ['noupdate', 'nodejs'];
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get install -y nodejs\nRUN echo testing unless');
                    done();
                });
            })
            
            it('generates contents correctly with tags (unless, only)', function(done) {
                tags = ['noupdate', 'nodejs', 'echo_a', 'echo_b'];
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nMAINTAINER Joe Somebody\nRUN apt-get install -y nodejs\nRUN echo testing only');
                    done();
                });
            })

            it('accepts single tag as string', function(done) {

                // done testing only/unless tag stuff, remove last 2 steps
                spaniel.steps.splice(-2,2)
            
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
            
            it('requires \'from\' (for parent file)', function(done) {
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
                    var_1: 'curl',
                    var_2: 'wget'
                };
                spaniel.steps.push({
                    instruction: 'run',
                    arguments: 'apt-get install -y {{var_1}} {{var_2}}'
                });
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y curl wget');
                    done();
                });
            })
            
            it('prefers environment variables over defaults', function(done) {
                process.env['DS_VAR_1'] = 'screen';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y screen wget');
                    delete process.env['DS_VAR_1'];
                    done();
                });
            })
            
            it('step.file attribute supported', function(done) {
                spaniel.steps.push({
                    comment: 'external file',
                    file: 'data/subdir/Dockerfile1'
                });
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y curl wget\n\n# external file\nRUN touch /tmp/file.json\nRUN rm /tmp/file.json');
                    done();
                });
            })
            
            it('step.file supports handlebars templating', function(done) {
                spaniel.steps[3] = {
                    comment: 'external file',
                    file: 'data/subdir/Dockerfile2'
                };
                spaniel.defaults['s'] = [
                    'RUN touch /tmp/file2.json',
                    'RUN rm /tmp/file2.json'
                ];
                spaniel.defaults['s3'] = 'RUN echo "step 3"';
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y curl wget\n\n# external file\nRUN touch /tmp/file2.json\nRUN rm /tmp/file2.json\nRUN echo "step 3"');
                    done();
                });
            })
            
            it('step.include attribute supported', function(done) {
                spaniel.steps.push({
                    comment: 'external Spanielfile',
                    include: 'data/subdir/include1.json'
                });
                ds.generateContents(spaniel, tags, function(err, contents) {
                    should.not.exist(err);
                    should.exists(contents);
                    contents.should.equal('FROM ubuntu:12.04\nRUN apt-get update\nRUN apt-get install -y curl wget\n\n# external file\nRUN touch /tmp/file2.json\nRUN rm /tmp/file2.json\nRUN echo \"step 3\"\n\n# external Spanielfile\nRUN echo \"this is coming from include\"\nRUN echo \"override from include\"');
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
                    should.not.exist(err);
                    fs.readFile(options.output, 'utf8', function (err, data) {
                        should.not.exist(err);
                        data.should.not.be.empty;
                        (data.indexOf('FROM ')).should.not.equal(-1);
                        done();
                    });
                });
            })
            
            it('requires valid JSON', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_invalid',
                    output:  tmp + '/Dockerfile2' 
                };

                ds.createDockerfile(options, function(err, contents) {
                    should.exist(err);
                    should.not.exist(contents);
                    done();
                });
            })
            
            it('supports step.file w/ handlebars', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_valid2',
                    output:  tmp + '/Dockerfile3' 
                };
                ds.createDockerfile(options, function(err, contents) {
                    should.not.exist(err);
                    fs.readFile(options.output, 'utf8', function (err, data) {
                        should.not.exist(err);
                        data.should.equal('FROM ubuntu:12.04\nRUN apt-get update\n\n# external file\nRUN touch /tmp/file2.json\nRUN rm /tmp/file2.json\nRUN echo \"step 3\"');
                        done();
                    });
                });
            })
            
            it('supports step.include w/ handlebars', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_valid3',
                    output:  tmp + '/Dockerfile4' 
                };
                ds.createDockerfile(options, function(err, contents) {
                    should.not.exist(err);
                    fs.readFile(options.output, 'utf8', function (err, data) {
                        should.not.exist(err);
                        data.should.equal('FROM ubuntu:12.04\nRUN apt-get update\n\n# external Spanielfile\nRUN echo \"this is coming from include\"\nRUN echo \"override from include\"');
                        done();
                    });
                });
            })
            
            it('requires \'from\' (for parent file)', function(done) {
                options = {
                    input:  __dirname + '/data/Spanielfile_no_from',
                    output:  tmp + '/Dockerfile5' 
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
