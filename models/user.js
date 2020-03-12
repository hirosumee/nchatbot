/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/12/20, 6:07 PM.
 */

const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    psid: String,
    name: String,
    first_name: String,
    last_name: String,
    profile_pic: String,
    gender: {
        type: String,
        default: 'unknown'
    },
    lastSetGender: Date,
    queuing: {
        type: Boolean,
        default: false
    },
    //report and block
    block: {
        default: false,
        type: Boolean
    },
    blockDetail: {
        type: String,
        default: ''
    },
    reportedTimes: {
        type: Number,
        default: 0
    },
    reportTimes: {
        type: Number,
        default: 0
    },
    reportedBy: {
        type: [String],
        default: []
    },
    lastReport: {
        type: Date,
        default: Date.now
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
schema.statics.findAndReport = async function(psid) {
    const user = await this.findOne({ psid });
    if (user) {
        user.lastReport = new Date();
        user.reportedTimes++;
        user.reportedBy.push(psid);
        return user.save();
    }
    return undefined;
};
schema.methods.isBlock = function() {
    return this.block;
};
schema.methods.blockMe = function(reason) {
    this.block = true;
    this.blockDetail = reason;
    return this.save();
};
schema.methods.shouldBlock = function() {
    return this.reportedTimes >= 4;
};
schema.methods.canReport = async function() {
    if (this.reportTimes > 2 && this.lastReport) {
        const lDate = new Date(this.lastReport);
        const nDate = new Date();
        // if can reset
        if (isInDifferenceDay(lDate, nDate)) {
            this.reportTimes = 0;
            this.lastReport = new Date();
            await this.save();
        }
    }
    return this.reportTimes <= 2;
};

function isInDifferenceDay(lDate, nDate) {
    return lDate.getFullYear() !== nDate.getFullYear() || lDate.getUTCMonth() !== nDate.getUTCMonth() || lDate.getDate() !== nDate.getDate();
}

schema.methods.reported = function() {
    this.reportTime++;
    return this.save();
};

const model = mongoose.model('user', schema);
module.exports = model;
