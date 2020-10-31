/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 3:09 PM.
 */

const conversationModel = require('../models/conversation');
const semester = require('./semester');
const { sendDaysOfWeekForSemester } = require('./util');
const { sendReadStatus } = require('./util');
const { sendBlocking, sendSetGender } = require('./util');
const { sendCmdList } = require('./util');
const { join, report, quit } = require('./postback');
const { callSendAPI } = require('./api');
const { forwardTextMessage } = require('./util');
const { sendFriendNotFound } = require('./util');
const { getFriendId } = require('./util');
const { sendConversationNotFound } = require('./util');
const { sendUserNotFound } = require('./util');
const { getUser } = require('./util');
const debug = require('debug')('chatbot:messaging');
module.exports.procText = procTextMessage;
module.exports.procAttachment = procAttachMessage;
module.exports.procRead = procRead;
async function procRead(psid) {
    const user = await getUser(psid);
    if (user) {
        const conversation = await conversationModel.getAliveConversation(psid);
        if (conversation) {
            const friendId = getFriendId(psid, conversation);
            if (friendId) {
                return sendReadStatus(friendId);
            }
        }
    }
}
async function procTextMessage(psid, message) {
    const user = await getUser(psid);
    if (!user) {
        debug('cant get user info');
        return sendUserNotFound(psid);
    }
    //
    if (user.shouldBlock()) {
        await user.blockMe('Bị báo cáo 4 lần');
    }
    if (user.isBlock()) {
        return sendBlocking(psid, user.blockDetail);
    }

    //
    const text = message.text.toLowerCase();
    if (text === '#join') {
        return join(psid);
    } else if (text === '#quit') {
        return quit(psid);
    } else if (text === '#cmd') {
        return sendCmdList(psid);
    } else if (text === '#gender') {
        return sendSetGender(psid);
    } else if (text === '#report') {
        return report(user);
    } else if (text === '#desemester') {
        return semester.deregister(user);
    }
    if (text.startsWith('#semester')) {
        const student_id = text.split(' ')[1];
        if (!student_id) {
            // send list
            return sendDaysOfWeekForSemester(psid);
        }
        if (semester.isPTITStudentID(student_id)) {
            return semester.register(user, student_id);
        }
    }
    const conversation = await conversationModel.getAliveConversation(psid);
    if (!conversation) {
        return sendConversationNotFound(psid);
    }
    const friendId = getFriendId(psid, conversation);
    if (!friendId) {
        return sendFriendNotFound(psid);
    }
    return forwardTextMessage(friendId, message.text);
}

async function procAttachMessage(psid, attachments) {
    const user = await getUser(psid);
    if (!user) {
        debug('cant get user info');
        return sendUserNotFound(psid);
    }
    const conversation = await conversationModel.getAliveConversation(psid);
    if (!conversation) {
        return sendConversationNotFound(psid);
    }
    const friendId = getFriendId(psid, conversation);
    if (!friendId) {
        return sendFriendNotFound(psid);
    }
    for (let attachment of attachments) {
        debug(attachment);
        const payload = attachment.payload;
        if (payload && payload.sticker_id) {
            delete payload.sticker_id;
        }
        await callSendAPI(friendId, { attachment });
    }
}
