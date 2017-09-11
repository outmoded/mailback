'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');
const MailParser = require('mailparser');
const SmtpServer = require('smtp-server');
const Wreck = require('wreck');


// Declare internals

const internals = {};


internals.schema = Joi.object({
    host: Joi.string().default('0.0.0.0'),
    port: Joi.number().integer().min(0).default(0),
    onMessage: Joi.func().required(),
    smtp: Joi.object({
        onData: Joi.forbidden()
    })
        .unknown()
});


exports.Server = internals.Server = function (options) {

    options = Joi.attempt(options, internals.schema, 'Invalid server options');
    this._settings = Hoek.clone(options);
    this._settings.smtp = this._settings.smtp || {};
    this._settings.smtp.disabledCommands = this._settings.smtp.disabledCommands || ['AUTH'];
    this._settings.smtp.logger = (this._settings.smtp.logger !== undefined ? this._settings.smtp.logger : false);
    this._settings.smtp.onData = (stream, session, callback) => this._onMessage(stream, session, callback);

    this._server = new SmtpServer.SMTPServer(this._settings.smtp);
};


internals.Server.prototype.start = function (callback) {

    callback = callback || Hoek.ignore;

    this._server.listen(this._settings.port, this._settings.host, () => {

        const address = this._server.server.address();
        this.info = {
            address: address.address,
            port: address.port
        };

        return callback();
    });
};


internals.Server.prototype.stop = function (callback) {

    callback = callback || Hoek.ignore;

    this._server.close(callback);
};


internals.Server.prototype._onMessage = function (stream, session, callback) {

    const next = (err, mail) => {

        this._settings.onMessage(err, mail);
        return callback();
    };

    Wreck.read(stream, {}, (err, message) => {

        if (err) {
            return next(err);
        }

        MailParser.simpleParser(message, (err, mail) => {

            if (err) {
                return next(err);
            }

            mail.from = mail.from.value;
            mail.to = mail.to.value;

            return next(null, mail);
        });
    });
};
