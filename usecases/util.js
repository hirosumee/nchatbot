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

async function sendLeaveConversation(psid) {
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
    return sendText(psid, 'Có lỗi xảy ra: Không khởi tạo được tài khoản !');
}

async function sendConversationNotFound(psid) {
    return sendText(psid, 'Bạn không ở phòng nào !. Tìm phòng thôi ...');
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
            'payload': '{"subject":"quit"}'
        },
        'persistent_menu': [
            {
                'locale': 'default',
                'composer_input_disabled': true,
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
