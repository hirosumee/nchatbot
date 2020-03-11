require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chatbot', { useNewUrlParser: true, useFindAndModify: true }).then(function() {
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
