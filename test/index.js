'use strict';

// Load modules

const Code = require('code');
const Email = require('emailjs');
const Lab = require('lab');
const Mailback = require('..');


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

            expect(message.from).to.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n\n\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        const server = new Mailback.Server({ onMessage: onMessage });
        server.start(() => {

            const headers = {
                from: 'test <test@example.com>',
                to: 'someone <someone@example.com>',
                subject: 'hello',
                text: 'I got something to tell you'
            };

            const message = Email.message.create(headers);
            const mailer = Email.server.connect(server.info);
            mailer.send(message, (err, output) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('overrides defaults', (done) => {

        const onMessage = (err, message) => {

            expect(message.from).to.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n\n\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        const server = new Mailback.Server({
            onMessage: onMessage,
            smtp: {
                logger: false,
                disabledCommands: ['AUTH']
            }
        });

        server.start(() => {

            const headers = {
                from: 'test <test@example.com>',
                to: 'someone <someone@example.com>',
                subject: 'hello',
                text: 'I got something to tell you'
            };

            const message = Email.message.create(headers);
            const mailer = Email.server.connect(server.info);
            mailer.send(message, (err, output) => {

                expect(err).to.not.exist();
                server.stop(done);
            });
        });
    });

    it('allows start and stop without callbacks', (done) => {

        const onMessage = (err, message) => { };

        const server = new Mailback.Server({ onMessage: onMessage });
        server.start();
        server.stop();
        done();
    });
});
