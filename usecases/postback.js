/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/15/20, 6:00 PM.
 */

const conversationModel = require('../models/conversation');
const userModel = require('../models/user');
const { sendGetStarted } = require('./util');
const { sendUnQueued } = require('./util');
const { sendReported } = require('./util');
const { getFriendId } = require('./util');
const { sendExceededReportTimes } = require('./util');
const { sendSetGender } = require('./util');
const { sendCmdList } = require('./util');
const { sendSetGenderSuccessful } = require('./util');
const { sendWaitToSetGender } = require('./util');
const { sendNotSupportedGenderSetting } = require('./util');
const { sendAlreadyConversation } = require('./util');
const { sendJoined } = require('./util');
const { sendIsQueueing } = require('./util');
const { sendUserNotFound } = require('./util');
const { getUser } = require('./util');
const { sendLeaveConversation, sendConversationNotFound } = require('./util');

module.exports.procPostback = async function(psid, payload) {
    const subject = payload.subject;
    switch (subject) {
        case 'quit': {
            return quit(psid);
        }
        case 'join': {
            return join(psid);
        }
        case 'gender': {
            return sendSetGender(psid);
        }
        case 'set-gender': {
            return setGender(psid, payload.data);
        }
        case 'cmd': {
            return sendCmdList(psid);
        }
        case 'un-queue': {
            return unqueue(psid);
        }
        case 'get-started': {
            return sendGetStarted(psid);
        }
        case 'report': {
            const user = await getUser(psid);
            if (user) {
                return report(user);
            }
        }
    }
};
module.exports.join = join;
module.exports.quit = quit;
module.exports.report = report;
async function unqueue(psid) {
    await userModel.setNotQueue(psid);
    return sendUnQueued(psid);
}
async function report(user) {
    const conversation = await conversationModel.getAliveConversation(user.psid);
    if (!conversation) {
        return sendConversationNotFound(user.psid);
    }
    if (await user.canReport()) {
        const friendId = getFriendId(user.psid, conversation);
        await userModel.findAndReport(friendId);
        return await sendReported(user.psid);
    } else {
        return sendExceededReportTimes(user.psid);
    }
}

const twentyTwoHour = 24 * 60 * 60 * 1000;

async function setGender(psid, data) {
    const user = await getUser(psid);
    if (user) {
        if (~['male', 'female', 'unknown'].indexOf(data)) {
            if (
                !user.lastSetGender ||
                data === 'unknown' ||
                Date.now() - twentyTwoHour > new Date(user.lastSetGender).getTime()
            ) {
                user.lastSetGender = new Date();
                user.gender = data;
                await user.save();
                await sendSetGenderSuccessful(psid, data);
            } else {
                await sendWaitToSetGender(psid);
            }
        } else {
            return sendNotSupportedGenderSetting(psid);
        }
    } else {
        return sendUserNotFound(psid);
    }
}

async function join(psid) {
    const user = await getUser(psid);
    if (user) {
        const conversation = await conversationModel.getAliveConversation(psid);
        if (conversation) {
            return sendAlreadyConversation(psid);
        }
        await userModel.setQueue(psid);
        const friend = await userModel.findFriend(psid, user.gender);
        if (friend) {
            const members = [user.psid, friend.psid];
            for (let psid of members) {
                await userModel.setNotQueue(psid);
            }
            await conversationModel.createConversation(members);
            await sendJoined(members);
        } else {
            return sendIsQueueing(psid);
        }
    } else {
        return sendUserNotFound(psid);
    }
}

async function quit(psid) {
    const conversation = await conversationModel.getAliveConversation(psid);
    if (conversation) {
        await conversationModel.leaveConversation(conversation._id);
        return sendLeaveConversation(psid, conversation);
    } else {
        return sendConversationNotFound(psid);
    }
}
