const CronJob = require('cron').CronJob;
const { sendText } = require('./util');
const axios = require('axios');
const moment = require('moment');
const userModel = require('../models/user');
moment.tz.setDefault('Asia/Ho_Chi_Minh');

async function register(user, student_id) {
    if (!process.env.SEMESTER_API_URL) {
        await sendText(user.psid, 'Chức năng này tạm thời bị tạm dừng');
        return;
    }
    user.student_id = student_id;
    await user.save();
    const message = `Bạn đã đăng ký thông báo với mã sinh viên : ${student_id}`;
    await sendText(user.psid, message);
}
module.exports.register = register;

async function deregister(user) {
    const message = `Bạn đã tắt thông báo thời khóa biểu`;
    await user.unregisterFromStudentID()
    await sendText(user.psid, message);
}

module.exports.deregister = deregister;

function isPTITStudentID(student_id) {
    return /^[bBcC]\d{2}[dDcCnNQqTtsSkKMmRrPpAa]{4}\d{3}$/.test(student_id);
}

module.exports.isPTITStudentID = isPTITStudentID;

async function _getSemesterFromAPI(student_id, mode) {
    const APIURL = process.env.SEMESTER_API_URL;
    if (!APIURL) {
        return false;
    }
    try {
        const response = await axios.post(process.env.SEMESTER_API_URL, {
            student_id,
            mode
        });
        return response.data;
    } catch (e) {
        console.error(e);
        return false;
    }
}
const time_map = {
    1: '7h',
    3: '9h',
    5: '12h',
    7: '14h',
    9: '16h',
    11: '18h'
};
async function getSemester(psid, student_id, mode) {
    const data = _getSemesterFromAPI(student_id, mode);
    if (Array.isArray(data)) {
        let ms = data
            .map(
                i =>
                    `Môn: ${i.ten_mon_hoc} \nTiết Bắt Đầu: ${i.tiet_bat_dau} \nPhòng học: ${
                        i.phong_hoc
                    } \nBắt đầu vào lúc: ${time_map[i.tiet_bat_dau]}`
            )
            .join('\n===============\n');
        const text = data.length ? ms : 'Hôm nay bạn được nghỉ !!';
        return sendText(psid, text);
    }
}

module.exports.get = getSemester;

const job = new CronJob(
    '00 00 6 * * 1-7',
    async function() {
        try {
            const users = userModel.findRegistedStudents();
            if (Array.isArray(users)) {
                users.filter(u => u.student_id).forEach(user => {
                    getSemester(user.psid, user.student_id, "today")
                });
            }
        } catch (e) {
            console.log(e);
        }
    },
    null,
    true /* Start the job right now */,
    'Asia/Ho_Chi_Minh' /* Time zone of this job. */
);
job.start();
