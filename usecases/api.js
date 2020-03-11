/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/11/20, 10:01 PM.
 */

const axios = require('axios');
const debug = require('debug')('chatbot:api');
module.exports.getUserInfo = getUserInfo;
module.exports.callSendAPI = callSendAPI;
module.exports.sendProfileAPI = sendProfileAPI;

async function getUserInfo(user_psid) {
    const token = process.env.TOKEN;
    try {
        let resp = await axios({
            baseURL: 'https://graph.facebook.com',
            method: 'GET',
            url: '/v3.1/' + user_psid,
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

async function callSendAPI(sender_psid, response) {
    const token = process.env.TOKEN;
    // Construct the message body
    let request_body = {
        recipient: {
            id: sender_psid
        },
        message: response,
        webhook: true
    };
    debug('try to send message to :', sender_psid);
    // Send the HTTP request to the Messenger Platform
    axios({
        baseURL: 'https://graph.facebook.com/v2.6/me/messages',
        params: {
            access_token: token
        },
        method: 'POST',
        data: request_body
    })
        .then(function() {
            debug('sent to facebook :', sender_psid);
        })
        .catch(function(err) {
            debug(err);
            debug(err.response);
        });
}

function sendProfileAPI(psid, data) {
    return axios
        .post('https://graph.facebook.com/v6.0/me/messenger_profile?access_token=' + process.env.TOKEN, { psid, ...data })
        .then(function() {
            debug('send profile');
        })
        .catch(function(err) {
            debug(err);
            debug(err.response);
        });
}
