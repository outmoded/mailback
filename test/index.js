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

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Server', () => {

    it('calls back on new message', async () => {

        const onMessage = (err, message) => {

            expect(err).to.not.exist();
            expect(message.from).to.equal([{ address: 'test@example.com', name: 'test' }]);
            expect(message.text).to.equal('I got something to tell you\n');
            expect(message.subject).to.equal('hello');
            expect(message.to).to.equal([{ address: 'someone@example.com', name: 'someone' }]);
        };

        const server = new Mailback.Server({ onMessage });
        await server.start();
        await internals.email(server);
        await server.stop();
    });

    it('overrides defaults', async () => {

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

        await server.start();
        await internals.email(server);
        await server.stop();
    });

    it('errors on stream error', async () => {

        const orig = Wreck.read;
        Wreck.read = (stream, options, next) => {

            Wreck.read = orig;
            Wreck.read(stream, options, (errIgnore, message) => next(new Error()));
        };

        const onMessage = (err, message) => {

            expect(err).to.exist();
        };

        const server = new Mailback.Server({ onMessage });
        await server.start();
        await internals.email(server);
        await server.stop();
    });

    it('errors on parser error', async () => {

        const orig = MailParser.simpleParser;
        MailParser.simpleParser = () => {

            MailParser.simpleParser = orig;
            return Promise.reject(new Error());
        };

        const onMessage = (err, message) => {

            expect(err).to.exist();
        };

        const server = new Mailback.Server({ onMessage });
        await server.start();
        await internals.email(server);
        await server.stop();
    });
});


internals.email = function (server) {

    const mail = {
        from: 'test <test@example.com>',
        to: 'someone <someone@example.com>',
        subject: 'hello',
        text: 'I got something to tell you'
    };

    const transporter = Nodemailer.createTransport({ host: server.info.host, port: server.info.port, secure: false, ignoreTLS: true });
    return transporter.sendMail(mail);
};
