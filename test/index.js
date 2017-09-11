'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Mailback = require('..');
const MailParser = require('mailparser');
const Nodemailer = require('nodemailer');
const Wreck = require('wreck');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Server', () => {

    it('calls back on new message', (done) => {

        const onMessage = (err, message) => {

            expect(err).to.not.exist();
            expect(message.from).to.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        const server = new Mailback.Server({ onMessage });
        server.start(() => {

            internals.email(server, (err) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('overrides defaults', (done) => {

        const onMessage = (err, message) => {

            expect(err).to.not.exist();
            expect(message.from).to.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        const server = new Mailback.Server({
            onMessage,
            smtp: {
                logger: false,
                disabledCommands: ['AUTH']
            }
        });

        server.start(() => {

            internals.email(server, (err) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('allows start and stop without callbacks', (done) => {

        const onMessage = (err, message) => {

            expect(err).to.not.exist();
        };

        const server = new Mailback.Server({ onMessage });
        server.start();
        server.stop();
        done();
    });

    it('errors on stream error', { parallel: false }, (done) => {

        const orig = Wreck.read;
        Wreck.read = (stream, options, next) => {

            Wreck.read = orig;
            Wreck.read(stream, options, (errIgnore, message) => next(new Error()));
        };

        const onMessage = (err, message) => {

            expect(err).to.exist();
        };

        const server = new Mailback.Server({ onMessage });
        server.start(() => {

            internals.email(server, (err) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('errors on parser error', { parallel: false }, (done) => {

        const orig = MailParser.simpleParser;
        MailParser.simpleParser = (message, next) => {

            MailParser.simpleParser = orig;
            return next(new Error());
        };

        const onMessage = (err, message) => {

            expect(err).to.exist();
        };

        const server = new Mailback.Server({ onMessage });
        server.start(() => {

            internals.email(server, (err) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });
});


internals.email = function (server, callback) {

    const mail = {
        from: 'test <test@example.com>',
        to: 'someone <someone@example.com>',
        subject: 'hello',
        text: 'I got something to tell you'
    };

    const transporter = Nodemailer.createTransport({ host: server.info.host, port: server.info.port, secure: false, ignoreTLS: true });
    return transporter.sendMail(mail, callback);
};
