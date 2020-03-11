const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    conversation: String,
    content: String
}, { timestamps: true });

module.exports = mongoose.model('message', schema);
