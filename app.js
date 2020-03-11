/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/11/20, 10:14 PM.
 */

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true
}).then(function() {
    console.log('connected');
}).catch(function(e) {
    console.error(e);
});

const webhookRouter = require('./routes/webhook');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/webhook', webhookRouter);

module.exports = app;
