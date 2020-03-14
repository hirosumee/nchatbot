/*
 * Copyright (c) 2020.
 * Author: hirosume.
 * LastModifiedAt: 3/14/20, 3:41 PM.
 */

function createCmd(subject, data) {
    return JSON.stringify({ subject, data });
}
module.exports.JOIN = createCmd('join');
module.exports.LEAVE = createCmd('leave');
module.exports.GENDER = createCmd('gender');
module.exports.REPORT = createCmd('report');
