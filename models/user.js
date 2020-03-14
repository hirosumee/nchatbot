/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 8:51 PM.
 */

const mongoose = require('mongoose');
const schema = new mongoose.Schema(
    {
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
    },
    { timestamps: true }
);
const map = new Map();
schema.statics.firstOrCreate = async function(payload) {
    const psid = payload.psid;
    if (map.has(psid)) {
        return map.get(psid);
    }
    let user = await this.findOne({ psid }).exec();
    if (!user) {
        user = await this.create(payload);
    }
    map.set(psid, user);
    return user;
};
schema.statics.setQueue = function(psid) {
    map.delete(psid);
    return this.findOneAndUpdate({ psid }, { queuing: true }).exec();
};
schema.statics.setNotQueue = function(psid) {
    map.delete(psid);
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
        map.delete(psid);
        return user.save();
    }
    return undefined;
};
schema.methods.isBlock = function() {
    return this.block;
};
schema.methods.blockMe = function(reason) {
    map.delete(this.psid);
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
            map.delete(this.psid);
            await this.save();
        }
    }
    return this.reportTimes <= 2;
};

function isInDifferenceDay(lDate, nDate) {
    return (
        lDate.getFullYear() !== nDate.getFullYear() ||
        lDate.getUTCMonth() !== nDate.getUTCMonth() ||
        lDate.getDate() !== nDate.getDate()
    );
}

schema.methods.reported = function() {
    this.reportTime++;
    map.delete(this.psid);
    return this.save();
};

const model = mongoose.model('user', schema);
module.exports = model;
