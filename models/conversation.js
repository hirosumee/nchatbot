/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 9:05 PM.
 */

const mongoose = require('mongoose');
const schema = new mongoose.Schema(
    {
        members: {
            type: [String],
            default: []
        },
        end: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);
const map = new Map();
function cache(members, obj) {
    for (let psid of members) {
        map.set(psid, obj);
    }
}
function clear(members) {
    for (let psid of members) {
        map.delete(psid);
    }
}
schema.statics.getAliveConversation = function(psid) {
    if (map.has(psid)) {
        return map.get(psid);
    }
    return this.findOne({ end: false, members: psid })
        .exec()
        .then(res => {
            cache(res.members, res);
            return res;
        });
};
schema.statics.leaveConversationWithPsid = function(psid) {
    return this.findOneAndUpdate({ end: false, members: psid }, { end: true })
        .exec()
        .then(res => {
            clear(res.members);
            return res;
        });
};
schema.statics.leaveConversation = function(id) {
    return this.findOneAndUpdate({ end: false, _id: id }, { end: true })
        .exec()
        .then(res => {
            clear(res.members);
            return res;
        });
};
schema.statics.createConversation = function(members) {
    return this.create({ members }).then(res => {
        cache(members, res);
        return res;
    });
};
const model = mongoose.model('conversation', schema);
module.exports = model;
