var should = require('should');

var dockerspaniel_path = '../lib/dockerspaniel.js';

describe('dockerspaniel', function() {
    
    var ds;

    describe('module', function() {
        it('can be required', function() {
            (function() {
                ds = require(dockerspaniel_path);
            }).should.not.throw ();
        })
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
