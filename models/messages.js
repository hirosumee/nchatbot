/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/11/20, 10:01 PM.
 */

const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    conversation: String,
    content: String
}, { timestamps: true });

module.exports = mongoose.model('message', schema);
