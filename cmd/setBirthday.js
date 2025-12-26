const { setKey, getKey } = require("../utils/db");
const { verifyIcon, errorIcon } = require('../utils/icon.js');
const { PermissionsBitField } = require('discord.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'setbirthday',
    aliases: ['setbirth', 'setsinhnhat'],
    description: 'Thiết lập ngày sinh nhật cho thành viên (Lưu theo Guild)',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} | Chỉ **Quản trị viên** mới có quyền thực hiện!`);
        }

        const target = message.mentions.users.first() || message.author;
        const dateInput = message.mentions.users.first() ? args[1] : args[0];

        const datePattern = /^([0-9]{1,2})\/([0-9]{1,2})$/;
        if (!dateInput || !datePattern.test(dateInput)) {
            return message.reply(`${errorIcon} | Định dạng sai! Ví dụ: \`.setbirthday @User 25/12\``);
        }

        const [day, month] = dateInput.split('/').map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return message.reply(`${errorIcon} | Ngày hoặc tháng không hợp lệ!`);
        }

        try {
            // Cấu trúc key mới: birthday_guildId
            const guildKey = `birthday_${message.guild.id}`;
            
            // Lấy dữ liệu hiện tại của Guild (là 1 Object)
            let guildData = (await getKey(guildKey)) || {};

            // Cập nhật hoặc thêm mới sinh nhật của User vào Object
            guildData[target.id] = `${day}/${month}`;

            // Lưu lại vào DB
            await setKey(guildKey, guildData);

            return message.reply(`${verifyIcon} | Đã lưu sinh nhật của **${target.username}** (${day}/${month}) vào danh sách server.`);
        } catch (error) {
            console.error('Lỗi setbirthday:', error);
            message.reply(`${errorIcon} | Đã xảy ra lỗi khi lưu dữ liệu.`);
        }
    },
};