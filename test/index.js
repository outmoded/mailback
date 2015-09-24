// Load modules

var Code = require('code');
var Email = require('emailjs');
var Lab = require('lab');
var Mailback = require('..');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Server', function () {

    it('calls back on new message', function (done) {

        var onMessage = function (err, message) {

            expect(message.from).to.deep.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.deep.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        var server = new Mailback.Server({ onMessage: onMessage });
        server.start(function () {

            var headers = {
                from: 'test <test@example.com>',
                to: 'someone <someone@example.com>',
                subject: 'hello',
                text: 'I got something to tell you'
            };

            var message = Email.message.create(headers);
            var mailer = Email.server.connect(server.info);
            mailer.send(message, function (err, output) {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('overrides defaults', function (done) {

        var onMessage = function (err, message) {

            expect(message.from).to.deep.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.deep.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        var server = new Mailback.Server({
            onMessage: onMessage,
            smtp: {
                logger: false,
                disabledCommands: ['AUTH']
            }
        });

        server.start(function () {

            var headers = {
                from: 'test <test@example.com>',
                to: 'someone <someone@example.com>',
                subject: 'hello',
                text: 'I got something to tell you'
            };

            var message = Email.message.create(headers);
            var mailer = Email.server.connect(server.info);
            mailer.send(message, function (err, output) {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('allows start and stop without callbacks', function (done) {

        var onMessage = function (err, message) { };

        var server = new Mailback.Server({ onMessage: onMessage });
        server.start();
        server.stop();
        done();
    });
});
