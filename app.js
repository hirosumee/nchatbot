/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 9:34 PM.
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const debug = require('debug')('chatbot:app');
const xhub = require('express-x-hub');
mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(function() {
    debug('connected');
}).catch(function(e) {
    debug(e);
});

const webhookRouter = require('./routes/webhook');

const app = express();

app.use(logger(':method :url :status - :response-time ms'));
app.use(xhub({ algorithm: 'sha1', secret: process.env.SECRET }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/webhook', webhookRouter);

module.exports = app;
