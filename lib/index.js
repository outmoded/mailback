// Load modules

var Boom = require('boom');
var Hoek = require('hoek');
var Joi = require('joi');
var MailParser = require('mailparser');
var SmtpServer = require('smtp-server');


// Declare internals

var internals = {};


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

    var self = this;

    options = Joi.attempt(options, internals.schema, 'Invalid server options');
    this._settings = Hoek.clone(options);
    this._settings.smtp = this._settings.smtp || {};
    this._settings.smtp.disabledCommands = this._settings.smtp.disabledCommands || ['AUTH'];
    this._settings.smtp.logger = (this._settings.smtp.logger !== undefined ? this._settings.smtp.logger : false);
    this._settings.smtp.onData = function (stream, session, callback) {

        return self._onMessage(stream, session, callback);
    };

    this._server = new SmtpServer.SMTPServer(this._settings.smtp);
};


internals.Server.prototype.start = function (callback) {

    var self = this;

    callback = callback || Hoek.ignore;

    this._server.listen(this._settings.port, this._settings.host, function () {

        var address = self._server.server.address();
        self.info = {
            address: address.address,
            port: address.port
        };

        return callback();
    });
};


internals.Server.prototype.stop = function (callback) {

    callback = callback || Hoek.ignore;

    this._server.close(function () {

        return callback();
    });
};


internals.Server.prototype._onMessage = function (stream, session, callback) {

    var self = this;

    var parser = new MailParser.MailParser();

    parser.on('end', function (message) {

        self._settings.onMessage(null, message);
        return callback(null, 'Message accepted');
    });

    stream.pipe(parser);
};
