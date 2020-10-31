/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/15/20, 10:05 AM.
 */

const { callSendAPI } = require('./api');
const userModel = require('../models/user');
const { callSendActionAPI } = require('./api');
const { sendProfileAPI } = require('./api');
const { getUserInfo } = require('./api');
// const debug = require('debug')('chatbot:util');
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
module.exports.sendBlocking = sendBlocking;
module.exports.sendExceededReportTimes = sendExceededReportTimes;
module.exports.sendReported = sendReported;
module.exports.sendReadStatus = sendReadStatus;
module.exports.sendUnQueued = sendUnQueued;
module.exports.sendGetStarted = sendGetStarted;
module.exports.sendDaysOfWeekForSemester = sendDaysOfWeekForSemester;
module.exports.sendNotSubscribeAnyStudentID = sendNotSubscribeAnyStudentID;

async function sendButtons(psid, title, subtitle, ...buttons) {
    return callSendAPI(psid, {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: [
                    {
                        title,
                        subtitle,
                        buttons
                    }
                ]
            }
        }
    });
}
async function sendButtons2(psid, text, ...buttons) {
    return callSendAPI(psid, {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'button',
                text,
                buttons
            }
        }
    });
}
async function sendReadStatus(psid) {
    return callSendActionAPI(psid, 'mark_seen');
}
async function sendReported(psid) {
    return sendText(psid, 'Bạn đã report thành công !');
}

async function sendExceededReportTimes(psid) {
    return sendText(psid, 'Bạn đã report 2 lần trong ngày hôm nay. Vui lòng đợi ngày mai !!');
}

async function sendBlocking(psid, blockDetail) {
    return sendText(psid, 'Bạn đã bị chặn khỏi dịch vụ ! Với lý do : ' + blockDetail);
}

async function sendLeaveConversation(psid, conversation) {
    const friendId = getFriendId(psid, conversation);
    const button = {
        title: 'Bắt đầu tìm kiếm',
        type: 'postback',
        payload: '{"subject":"join"}'
    };
    if (friendId) {
        await sendButtons(friendId, 'Đối phương đã rời phòng !', '', button);
    }
    return sendButtons(psid, 'Bạn đã rời phòng', '', button);
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
async function sendUnQueued(psid) {
    const button = {
        title: 'Bắt đầu tìm kiếm.',
        type: 'postback',
        payload: '{"subject":"join"}'
    };
    return sendButtons(psid, 'Bạn đã rời hàng chờ.', 'Bạn chỉ có thể tìm bạn khi đang ở trong hàng chờ', button);
}
async function sendIsQueueing(psid) {
    const button = {
        title: 'Ngừng tìm kiếm',
        type: 'postback',
        payload: '{"subject":"un-queue"}'
    };
    return sendButtons(psid, 'Bạn đã được đưa vào hàng chờ', '', button);
}

async function sendFriendNotFound(psid) {
    return sendText(psid, 'Có lỗi xảy ra: Không tìm thấy thành viên còn lại!');
}

async function sendUserNotFound(psid) {
    return sendText(psid, 'Có lỗi xảy ra: Không khởi tạo được tài khoản !');
    // return sendCmdList(psid);
}

async function sendConversationNotFound(psid) {
    const button = {
        title: 'Bắt đầu tìm kiếm',
        type: 'postback',
        payload: '{"subject":"join"}'
    };
    return sendButtons(psid, 'Bạn không ở phòng nào !', 'Hoặc bắt đầu trò truyện với lệnh #join', button);
    // return sendCmdList(psid);
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
const cmds = [
    {
        title: 'Tìm kiếm phòng',
        type: 'postback',
        payload: '{"subject":"join"}'
    },
    {
        title: 'Rời phòng',
        type: 'postback',
        payload: '{"subject":"quit"}'
    }
];

function sendCmdList(psid) {
    return sendButtons(psid, `Danh sách lệnh hiện tại`, 'Bạn có thể nhấn hoăc gõ lệnh', ...cmds);
}
function sendGetStarted(psid) {
    const button = {
        title: 'Bắt đầu',
        type: 'postback',
        payload: '{"subject":"join"}'
    };
    return sendButtons(psid, 'Bắt đầu tìm bạn .', 'Bạn có thể gõ #cmd để lấy danh sách lệnh', button);
}

const genderBody = {
    text: 'Chọn giới tính của bạn !. Lưu ý bạn chỉ có thể đổi giới tính 24h/lần',
    quick_replies: [
        {
            content_type: 'text',
            title: 'Nam',
            payload: '{"subject":"set-gender","data":"male"}',
            image_url: 'https://ak4.picdn.net/shutterstock/videos/1008672844/thumb/5.jpg'
        },
        {
            content_type: 'text',
            title: 'Nữ',
            payload: '{"subject":"set-gender","data":"female"}',
            image_url: 'https://ak4.picdn.net/shutterstock/videos/1021780084/thumb/8.jpg'
        },
        {
            content_type: 'text',
            title: 'Không xác định',
            payload: '{"subject":"set-gender","data":"unknown"}',
            image_url: 'https://cdn1.iconfinder.com/data/icons/ui-set-6/100/Question_Mark-512.png'
        }
    ]
};

function sendSetGender(psid) {
    return callSendAPI(psid, genderBody);
}
async function sendAlreadyConversation(psid) {
    const button = {
        title: 'Rời phòng',
        type: 'postback',
        payload: '{"subject":"quit"}'
    };
    return sendButtons(psid, 'Bạn đã ở trong phòng khác .', 'Rời phòng cũ trước tìm bạn mới ', button);
}

async function sendJoined(psids) {
    for (let psid of psids) {
        await sendText(psid, 'Tìm thấy nhau rồi. Chào nhau đi nào !!');
    }
}
async function sendGenderNotFound(psid) {
    const button = {
        title: 'Cài đặt ngay',
        type: 'postback',
        payload: '{"subject":"gender"}'
    };
    return sendButtons(
        psid,
        'Chúng tôi không thể xác định giới tính của bạn.',
        'Dự trên giới tính bạn có thể tìm thấy bạn dễ dàng hơn',
        button
    );
}

async function getUser(psid) {
    let user = await userModel.findOne({ psid });
    if (!user) {
        const info = await getUserInfo(psid);
        // debug(info);
        if (info) {
            user = await userModel.create({ psid, ...info });
        } else {
            return undefined;
        }
        try {
            if (!user.gender || user.gender === 'unknown') {
                await sendGenderNotFound(psid);
            }
            await createPersistentMenu(psid);
        } catch (e) {
            console.error(e);
        }
    }
    return user;
}

async function createPersistentMenu(psid) {
    return sendProfileAPI(psid, {
        get_started: {
            payload: '{"subject":"get-started"}'
        },
        persistent_menu: [
            {
                locale: 'default',
                composer_input_disabled: false,
                call_to_actions: [
                    {
                        title: 'Tìm kiếm phòng',
                        type: 'postback',
                        payload: '{"subject":"join"}'
                    },
                    {
                        title: 'Rời phòng',
                        type: 'postback',
                        payload: '{"subject":"quit"}'
                    },
                    {
                        title: 'Nâng cao',
                        type: 'nested',
                        call_to_actions: [
                            {
                                title: 'Giới tính',
                                type: 'postback',
                                payload: '{"subject":"gender"}'
                            },
                            {
                                title: 'Báo cáo',
                                type: 'postback',
                                payload: '{"subject":"report"}'
                            }
                        ]
                    }
                ]
            }
        ]
    });
}

const smd_buttons = [
    {
        title: 'Hôm nay',
        type: 'postback',
        payload: '{"subject":"semester", "data": "today"}'
    },
    {
        title: 'Cả tuần',
        type: 'postback',
        payload: '{"subject":"semester", "data": "all"}'
    }
    // {
    //     title: 'Thứ 3',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 2}'
    // },
    // {
    //     title: 'Thứ 4',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 3}'
    // },
    // {
    //     title: 'Thứ 5',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 4}'
    // },
    // {
    //     title: 'Thứ 6',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 5}'
    // },
    // {
    //     title: 'Thứ 7',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 6}'
    // },
    // {
    //     title: 'CN',
    //     type: 'postback',
    //     payload: '{"subject":"semester", "data": 0}'
    // }
];

async function sendDaysOfWeekForSemester(psid) {
    return sendButtons2(psid, 'Chọn 1 ngày để xem TKB', ...smd_buttons);
}

async function sendNotSubscribeAnyStudentID(psid) {
    return sendText(psid, 'Bạn chưa đăng ký với bất cứ MSV nào');
}
