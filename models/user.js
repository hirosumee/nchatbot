/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/12/20, 10:40 AM.
 */

const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    psid: String,
    name: String,
    gender: {
        type: String,
        default: 'unknown'
    },
    lastSetGender: Date,
    queuing: {
        type: Boolean,
        default: false
    },
    block: {
        default: false,
        type: Boolean
    }
}, { timestamps: true });
schema.statics.firstOrCreate = async function(payload) {
    let user = await this.findOne({ psid: payload.psid }).exec();
    if (!user) {
        user = await this.create(payload);
    }
    return user;
};
schema.statics.setQueue = function(psid) {
    return this.findOneAndUpdate({ psid }, { queuing: true }).exec();
};
schema.statics.setNotQueue = function(psid) {
    return this.findOneAndUpdate({ psid }, { queuing: false }).exec();
};
schema.statics.findFriend = function(psid) {
    return this.findOne({ psid: { $ne: psid }, queuing: true }).exec();
};

const model = mongoose.model('user', schema);
module.exports = model;
