/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/12/20, 11:46 AM.
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
schema.statics.findFriend = function(psid, gender) {
    let genderQuery = {};
    if (gender === 'male') {
        genderQuery.gender = 'female';
    } else if (gender === 'female') {
        genderQuery.gender = 'male';
    }
    return this.findOne({ psid: { $ne: psid }, queuing: true, ...genderQuery }).exec();
};

const model = mongoose.model('user', schema);
module.exports = model;
