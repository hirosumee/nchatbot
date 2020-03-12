/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/12/20, 10:51 AM.
 */

const express = require('express');
const router = express.Router();
const messagingUsecase = require('../usecases/messaging');
const postbackUsecase = require('../usecases/postback');
let VERIFY_TOKEN = process.env.SECRET;

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
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.status(403).send('NOT VERIFIED');
            }
        } else {
            res.status(404).send('NOT VERIFIED');
        }
    })
    .post('/', function(req, res) {
        let body = req.body;

        // Checks this is an event from a page subscription
        if (body.object === 'page') {
            // Iterates over each entry - there may be multiple if batched
            body.entry.forEach(function(entry) {
                // Gets the message. entry.messaging is an array, but
                // will only ever contain one message, so we get index 0
                if (!entry.messaging) {
                    return;
                }
                let webhook_event = entry.messaging[0];
                // console.log(webhook_event);
                // Get the sender PSID
                let sender_psid = webhook_event.sender.id;
                console.log('Sender PSID: ' + sender_psid);

                // Check if the event is a message or postback and
                // pass the event to the appropriate handler function
                if (webhook_event.message) {
                    const message = webhook_event.message;
                    if (message.text) {
                        if (!message.isEcho) {
                            return messagingUsecase.procText(sender_psid, message);
                        }
                    } else if (message.attachments) {
                        if (!message.isEcho) {
                            return messagingUsecase.procAttachment(sender_psid, message.attachments);
                        }
                    }
                } else if (webhook_event.postback) {
                    // handlePostback(sender_psid, webhook_event.postback);
                    const payload = webhook_event.postback.payload;
                    const data = isJson(payload);
                    if (data) {
                        return postbackUsecase.procPostback(sender_psid, data);
                    }
                }
            });

            // Returns a '200 OK' response to all requests
            res.status(200).send('EVENT_RECEIVED');
        } else {
            // Returns a '404 Not Found' if event is not from a page subscription
            res.sendStatus(404);
        }
    });

function isJson(str) {
    console.log(str);
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}

module.exports = router;
