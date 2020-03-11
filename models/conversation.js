const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    members: {
        type: [String],
        default: []
    },
    end: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
schema.statics.getAliveConversation = function(psid) {
    return this.findOne({ end: false, members: psid }).exec();
};
schema.statics.leaveConversationWithPsid = function(psid) {
    return this.findOneAndUpdate({ end: false, members: psid }, { end: true }).exec();
};
schema.statics.leaveConversation = function(id) {
    return this.findOneAndUpdate({ end: false, _id: id }, { end: true }).exec();
};
schema.statics.createConversation = function(members) {
    return this.create({ members });
};
const model = mongoose.model('conversation', schema);
module.exports = model;
