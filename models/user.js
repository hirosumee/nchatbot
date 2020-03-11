const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    psid: String,
    name: String,
    gender: String,
    queuing: {
        type: Boolean,
        default: true
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
