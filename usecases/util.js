/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/12/20, 11:36 AM.
 */

const { callSendAPI } = require('./api');
const userModel = require('../models/user');
const { sendProfileAPI } = require('./api');
const { getUserInfo } = require('./api');
module.exports.getUser = getUser;
module.exports.sendText = sendText;
module.exports.sendLeaveConversation = sendLeaveConversation;
module.exports.sendConversationNotFound = sendConversationNotFound;
module.exports.forwardTextMessage = forwardTextMessage;
module.exports.getFriendId = getFriendId;
module.exports.sendFriendNotFound = sendFriendNotFound;
module.exports.sendUserNotFound = sendUserNotFound;
module.exports.sendIsQueueing = sendIsQueueing;
module.exports.sendJoined = sendJoined;
module.exports.createPersistentMenu = createPersistentMenu;
module.exports.sendAlreadyConversation = sendAlreadyConversation;
module.exports.sendCmdList = sendCmdList;
module.exports.sendSetGender = sendSetGender;
module.exports.sendNotSupportedGenderSetting = sendNotSupportedGenderSetting;
module.exports.sendWaitToSetGender = sendWaitToSetGender;
module.exports.sendSetGenderSuccessful = sendSetGenderSuccessful;

async function sendLeaveConversation(psid, conversation) {
    const friendId = getFriendId(psid, conversation);
    if (friendId) {
        await sendText(friendId, 'Bạn của bạn đã rời phòng !');
    }
    return sendText(psid, 'Bạn đã rời phòng');
}


async function sendText(psid, message) {
    return callSendAPI(psid, {
        text: message
    });
}


function forwardTextMessage(friendId, message) {
    return sendText(friendId, message);
}

function getFriendId(psid, conversation) {
    for (let id of conversation.members) {
        if (id !== psid) {
            return id;
        }
    }
    return undefined;
}

async function sendIsQueueing(psid) {
    return sendText(psid, 'Bạn đã được đưa vào hàng đợi');
}

async function sendFriendNotFound(psid) {
    return sendText(psid, 'Có lỗi xảy ra: Không tìm thấy thành viên còn lại!');
}

async function sendUserNotFound(psid) {
    // return sendText(psid, 'Có lỗi xảy ra: Không khởi tạo được tài khoản !');
    return sendCmdList(psid);
}

async function sendConversationNotFound(psid) {
    // return sendText(psid, 'Bạn không ở phòng nào !. Tìm phòng thôi . Hoặc gõ #cmd để xem các lệnh .');
    return sendCmdList(psid);
}

function sendNotSupportedGenderSetting(psid) {
    return sendText(psid, 'Có vẻ giới tính bạn chọn chưa được hỗ trợ');
}

function sendWaitToSetGender(psid) {
    return sendText(psid, 'Bạn đã cài đặt giới tính trong vòng 24h qua . ');
}

function sendSetGenderSuccessful(psid, gender) {
    let nGender = 'Không xác định';
    if (gender === 'male') {
        nGender = 'Nam';
    } else if (gender === 'female') {
        nGender = 'Nữ';
    }
    return sendText(psid, 'Đặt lại giới tính thành công. Hiện tại giới tính của bạn là : ' + nGender);
}

function sendCmdList(psid) {
    return sendText(psid, `
- Tìm phòng: #join
- Rời phòng: #quit
- Danh sách lệnh: #cmd
- Đặt giới tính: #gender
    `);
}

const genderBody = {
    text: 'Chọn giới tính của bạn !. Lưu ý bạn chỉ có thể đổi giới tính 24h/lần',
    'quick_replies': [
        {
            'content_type': 'text',
            'title': 'Nam',
            'payload': '{"subject":"set-gender","data":"male"}',
            'image_url': 'https://ak4.picdn.net/shutterstock/videos/1008672844/thumb/5.jpg'
        }, {
            'content_type': 'text',
            'title': 'Nữ',
            'payload': '{"subject":"set-gender","data":"female"}',
            'image_url': 'https://ak4.picdn.net/shutterstock/videos/1021780084/thumb/8.jpg'
        },
        {
            'content_type': 'text',
            'title': 'Không xác định',
            'payload': '{"subject":"set-gender","data":"unknown"}',
            'image_url': 'https://cdn1.iconfinder.com/data/icons/ui-set-6/100/Question_Mark-512.png'
        }
    ]
};

function sendSetGender(psid) {
    return callSendAPI(psid, genderBody);
}

async function sendAlreadyConversation(psid) {
    return sendText(psid, 'Bạn đã ở trong phòng khác .');
}

async function sendJoined(psids) {
    for (let psid of psids) {
        await sendText(psid, 'Đã tìm thấy phòng. Chào nhau đi nào !!');
    }
}

async function getUser(psid) {
    let user = await userModel.findOne({ psid });
    if (!user) {
        const info = await getUserInfo(psid);
        if (info) {
            user = await userModel.create({ psid, info });
        } else {
            return undefined;
        }
        await createPersistentMenu(psid);
    }
    return user;
}


async function createPersistentMenu(psid) {
    return sendProfileAPI(psid, {
        'get_started': {
            'payload': '{"subject":"cmd"}'
        },
        'persistent_menu': [
            {
                'locale': 'default',
                'composer_input_disabled': false,
                'call_to_actions': [
                    {
                        'title': 'Tìm kiếm phòng',
                        'type': 'postback',
                        'payload': '{"subject":"join"}'
                    },
                    {
                        'title': 'Rời phòng',
                        'type': 'postback',
                        'payload': '{"subject":"quit"}'
                    }
                ]
            }
        ]
    });
}
