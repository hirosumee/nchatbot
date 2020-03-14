/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 3:58 PM.
 */

const express = require('express');
const router = express.Router();
const messagingUsecase = require('../usecases/messaging');
const postbackUsecase = require('../usecases/postback');
const debug = require('debug')('chatbot:webhook');
let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

router
    .get('/', function(req, res) {
        // Your verify token. Should be a random string.
        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        // Checks if a token and mode is in the query string of the request
        if (mode && token) {
            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                // Responds with the challenge token from the request
                debug('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.status(403).send('NOT VERIFIED');
            }
        } else {
            res.status(404).send('NOT VERIFIED');
        }
    })
    .post('/', async function(req, res) {
        let body = req.body;
        if (!req.isXHubValid()) {
            debug('Warning - request header X-Hub-Signature not present or invalid');
            return res.sendStatus(401);
        }
        // Checks this is an event from a page subscription
        if (body.object === 'page') {
            // Iterates over each entry - there may be multiple if batched
            for (let entry of body.entry) {
                // Gets the message. entry.messaging is an array, but
                // will only ever contain one message, so we get index 0
                if (entry.messaging) {
                    let webhook_event = entry.messaging[0];
                    // console.log(webhook_event);
                    // Get the sender PSID
                    let sender_psid = webhook_event.sender.id;
                    debug('Sender PSID: ' + sender_psid);
                    // Check if the event is a message or postback and
                    // pass the event to the appropriate handler function
                    if (webhook_event.message) {
                        await procMessage(sender_psid, webhook_event.message);
                    } else if (webhook_event.postback) {
                        await procPostback(sender_psid, webhook_event.postback);
                    } else if (webhook_event.read) {
                        debug('read message:', webhook_event.read);
                        await procReadMessage(sender_psid, webhook_event.read);
                    } else if (webhook_event.reaction) {
                        debug('reaction: ', webhook_event.reaction);
                        await procReaction(sender_psid, webhook_event.reaction);
                    }
                }
            }
            // Returns a '200 OK' response to all requests
            res.status(200).send('EVENT_RECEIVED');
        } else {
            // Returns a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }
    });
async function procMessage(sender_psid, message) {
    if (message.isEcho) {
        return;
    }
    if (message.text) {
        if (message.quick_reply) {
            await procPostback(sender_psid, message.quick_reply);
        }
        await messagingUsecase.procText(sender_psid, message);
    } else if (message.attachments) {
        await messagingUsecase.procAttachment(sender_psid, message.attachments);
    }
}
async function procPostback(sender_psid, postback) {
    const payload = postback.payload;
    // debug(webhook_event.postback);
    const data = isJson(payload);
    if (data) {
        await postbackUsecase.procPostback(sender_psid, data);
    }
}
async function procReadMessage(sender_psid) {
    return messagingUsecase.procRead(sender_psid);
}
async function procReaction(sender_psid, reaction) {}
function isJson(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}

module.exports = router;
