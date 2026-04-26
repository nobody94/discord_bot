const { setKey, getKey } = require("../utils/db.js");
const { verifyIcon, errorIcon } = require('../utils/icon.js');
const { PermissionsBitField,EmbedBuilder } = require('discord.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'birthday',
    aliases: ['bd', 'sn'],
    description: '',

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} | Chỉ **Quản trị viên** mới có quyền thực hiện!`);
        }

        const action = args[0]?.toLowerCase();
        const guildKey = `birthday_${message.guild.id}`;

        if (!action || !["check", "set"].includes(action)) {
            return message.reply(`.sn set @user ngày/tháng\n.sn check @user/số tháng`);
        }

        if (action == 'set') {
            const target = message.mentions.users.first() || message.author;
            const dateInput = message.mentions.users.first() ? args[2] : args[1];

            const datePattern = /^([0-9]{1,2})\/([0-9]{1,2})$/;
            if (!dateInput || !datePattern.test(dateInput)) {
                return message.reply(`${errorIcon} | Định dạng sai! Ví dụ: \`.sn set @User 01/11\``);
            }

            const [day, month] = dateInput.split('/').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                return message.reply(`${errorIcon} | Ngày hoặc tháng không hợp lệ!`);
            }

            try {   
                let guildData = (await getKey(guildKey)) || {};

                guildData[target.id] = `${day}/${month}`;

                await setKey(guildKey, guildData);

                return message.reply(`${verifyIcon} | Đã lưu sinh nhật của **<@${target.id}>** (${day}/${month}) vào danh sách server.`);
            } catch (error) {
                console.error('Lỗi .sn set:', error);
                message.reply(`${errorIcon} | Đã xảy ra lỗi khi lưu dữ liệu.`);
            }
        }

        if (action == 'check') {
            const target = message.mentions.users.first();
            const monthQuery = parseInt(args[1]);
            const isMonthSearch = !isNaN(monthQuery) && monthQuery >= 1 && monthQuery <= 12;            

            try {
                // Lấy toàn bộ dữ liệu sinh nhật của server
                const guildData = (await getKey(guildKey)) || {};

                // 1. Nếu kiểm tra riêng 1 người
                if (target) {
                    const birthday = guildData[target.id];
                    if (!birthday) return message.reply(`${errorIcon} | **${target.username}** chưa có trong danh sách.`);
                    // Sử dụng mention người dùng trong câu trả lời
                    return message.reply(`📅 Sinh nhật của <@${target.id}> là: **${birthday}**`);
                }

                // 2. Nếu xem danh sách
                let birthdayList = [];

                for (const [userId, dateStr] of Object.entries(guildData)) {
                    const [d, m] = dateStr.split('/').map(Number);

                    // Kiểm tra điều kiện lọc theo tháng hoặc tất cả
                    if (isMonthSearch) {
                        if (m === monthQuery) {
                            birthdayList.push({ mention: `<@${userId}>`, date: dateStr, d, m });
                        }
                    } else {
                        birthdayList.push({ mention: `<@${userId}>`, date: dateStr, d, m });
                    }
                }

                // Sắp xếp theo ngày tháng
                birthdayList.sort((a, b) => a.m - b.m || a.d - b.d);

                const embed = new EmbedBuilder()
                    .setTitle(isMonthSearch ? `🎂 SINH NHẬT THÁNG ${monthQuery} 🎂` : '🎂 DANH SÁCH SINH NHẬT SERVER 🎂')
                    .setColor('#00FF99')
                    .setTimestamp();

                if (birthdayList.length === 0) {
                    embed.setDescription(`Không tìm thấy dữ liệu sinh nhật nào.`);
                } else {
                    // Hiển thị danh sách kèm mention
                    embed.setDescription(birthdayList.map(b => `• ${b.mention}: **${b.date}**`).join('\n'));
                }

                return message.channel.send({ embeds: [embed] });

            } catch (error) {
                console.error('Lỗi checkbirthday:', error);
                message.reply(`${errorIcon} | Lỗi khi truy xuất dữ liệu.`);
            }
        }
    },
};