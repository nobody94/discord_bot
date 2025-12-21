const { renderKey, setKey, getKey } = require("../utils/db");
const { verifyIcon, errorIcon } = require('../utils/icon.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setbirthday',
    aliases: ['setbirth', 'setsinhnhat'],
    description: 'Admin thiết lập ngày sinh nhật cho thành viên (Ngày/Tháng)',

    async execute(message, args) {
        // 1. KIỂM TRA QUYỀN ADMIN
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply(`${errorIcon} | Chỉ **Quản trị viên** mới có quyền thiết lập ngày sinh nhật trên hệ thống!`);
        }

        // 2. Xác định người dùng được thiết lập
        const target = message.mentions.users.first() || message.author;
        
        // Lấy tham số ngày tháng (nếu có tag người dùng thì args[1], nếu không tag thì args[0])
        const dateInput = message.mentions.users.first() ? args[1] : args[0];

        // 3. Kiểm tra định dạng đầu vào (Ngày/Tháng)
        const datePattern = /^([0-9]{1,2})\/([0-9]{1,2})$/;
        if (!dateInput || !datePattern.test(dateInput)) {
            return message.reply(`${errorIcon} | Định dạng sai! Vui lòng nhập: \`.setbirthday @User Ngày/Tháng\`\nVí dụ: \`.setbirthday @A 25/12\``);
        }

        const [day, month] = dateInput.split('/').map(Number);

        // 4. Kiểm tra tính hợp lệ của ngày tháng
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return message.reply(`${errorIcon} | Ngày hoặc tháng không tồn tại!`);
        }
        if (month === 2 && day > 29) {
            return message.reply(`${errorIcon} | Tháng 2 không thể có quá 29 ngày!`);
        }

        try {
            // 5. Lưu vào Database bằng renderKey đồng bộ với balo.js
            const birthKey = renderKey("user_birthday", target.id);
            await setKey(birthKey, `${day}/${month}`);

            return message.reply(`${verifyIcon} | **Hệ thống Birthday:** Đã xác nhận ngày sinh của **${target.username}** là ngày **${day}/${month}**.`);

        } catch (error) {
            console.error('Lỗi setbirthday:', error);
            message.reply(`${errorIcon} | Đã xảy ra lỗi khi lưu ngày sinh.`);
        }
    },
};