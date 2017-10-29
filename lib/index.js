'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');
const MailParser = require('mailparser');
const SmtpServer = require('smtp-server');
const Teamwork = require('teamwork');
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


internals.Server.prototype.start = async function () {

    const team = new Teamwork();
    this._server.listen(this._settings.port, this._settings.host, () => team.attend());
    await team.work;

    const address = this._server.server.address();
    this.info = {
        address: address.address,
        port: address.port
    };
};


internals.Server.prototype.stop = async function () {

    const team = new Teamwork();
    this._server.close(() => team.attend());
    await team.work;
};


internals.Server.prototype._onMessage = async function (stream, session, callback) {

    try {
        const message = await Wreck.read(stream);
        const mail = await MailParser.simpleParser(message);
        mail.from = mail.from.value;
        mail.to = mail.to.value;
        this._settings.onMessage(null, mail);
    }
    catch (err) {
        this._settings.onMessage(err);
    }

    return callback();
};
