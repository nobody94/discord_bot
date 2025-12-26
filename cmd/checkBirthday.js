const { EmbedBuilder } = require('discord.js');
const { getKey } = require("../utils/db");
const { errorIcon } = require('../utils/icon.js');

module.exports = {
    name: 'checkbirthday',
    aliases: ['checkbirth', 'birthdaylist', 'xemsinhnhat'],
    description: 'Xem danh sách sinh nhật',

    async execute(message, args) {
        const target = message.mentions.users.first();
        const monthQuery = parseInt(args[0]);
        const isMonthSearch = !isNaN(monthQuery) && monthQuery >= 1 && monthQuery <= 12;
        
        const guildKey = `birthday_${message.guild.id}`;

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
                        // Lưu chuỗi mention <@id> thay vì tên
                        birthdayList.push({ mention: `<@${userId}>`, date: dateStr, d, m });
                    }
                } else if (args.length === 0) {
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
    },
};