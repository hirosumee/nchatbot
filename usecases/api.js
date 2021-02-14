/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/15/20, 5:55 PM.
 */

const axios = require('axios');
const debug = require('debug')('chatbot:api');
module.exports.getUserInfo = getUserInfo;
module.exports.callSendAPI = callSendAPI;
module.exports.sendProfileAPI = sendProfileAPI;
module.exports.callSendActionAPI = callSendActionAPI;

async function getUserInfo(user_psid) {
    const token = process.env.TOKEN;
    try {
        let resp = await axios({
            baseURL: 'https://graph.facebook.com',
            method: 'GET',
            url: '/v6.0/' + user_psid,
            params: {
                access_token: token,
                fields: 'id,name,first_name,last_name,profile_pic,gender'
            }
        });
        return resp.data;
    } catch (e) {
        debug(e);
        return undefined;
    }
}
async function callSendActionAPI(sender_psid, sender_action) {
    const token = process.env.TOKEN;
    // Construct the message body
    let request_body = {
        recipient: {
            id: sender_psid
        },
        sender_action
    };
    // debug('try to send message to :', sender_psid);
    // Send the HTTP request to the Messenger Platform
    axios({
        baseURL: 'https://graph.facebook.com/v6.0/me/messages',
        params: {
            access_token: token
        },
        method: 'POST',
        data: request_body
    })
        .then(function() {
            debug('sent to facebook :', sender_psid);
            return true;
        })
        .catch(function(err) {
            debug(err.response);
            if (!err.response) return err.response;
            return err.response.data.error.code;
        });
}

async function callSendAPI(recipient_psid, response, depth = 0) {
    if (depth > 1) {
        return 5000;
    }
    const token = process.env.TOKEN;
    // Construct the message body
    let request_body = {
        recipient: {
            id: recipient_psid
        },
        message: response,
        webhook: true
    };
    if (depth !== 0) {
        request_body.messaging_type = 'MESSAGE_TAG';
        request_body.tag = 'CONFIRMED_EVENT_UPDATE';
    }
    // debug('try to send message to :', sender_psid);
    // Send the HTTP request to the Messenger Platform
    return axios({
        baseURL: 'https://graph.facebook.com/v6.0/me/messages',
        params: {
            access_token: token
        },
        method: 'POST',
        data: request_body
    })
        .then(function() {
            // debug('sent to facebook :', sender_psid);
            return null;
        })
        .catch(function(err) {
            if (!err.response) {
                debug(err);
                return 1000;
            }
            // let error = err.response.data.error;
            // debug(error);
            // debug(request_body);
            // if (error.code === 10) {
            //     //resend
            //     return callSendAPI(recipient_psid, response, depth + 1);
            // }
            return err.response.data.error.code;
        });
}

function sendProfileAPI(psid, data) {
    return axios
        .post('https://graph.facebook.com/v6.0/me/messenger_profile?access_token=' + process.env.TOKEN, {
            psid,
            ...data
        })
        .then(function() {
            // debug('send profile');
        })
        .catch(function(err) {
            if (!err.response) {
                debug(err);
                return;
            }
            debug(err.response.error);
        });
}
