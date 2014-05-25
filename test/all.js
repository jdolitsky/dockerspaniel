var should = require('should');

var dockerspaniel_path = '../lib/dockerspaniel.js';

describe('dockerspaniel', function() {
    describe('module', function() {
        it('can be required', function() {
            (function() {
                require(dockerspaniel_path);
            }).should.not.throw ();
        });
    });
});
