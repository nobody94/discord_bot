const { EmbedBuilder } = require('discord.js');
const { renderKey, getKey } = require("../utils/db");
const { errorIcon } = require('../utils/icon.js');
const { PermissionsBitField } = require('discord.js');
const {DEVELOPER_IDS} = require('../utils/constant.js');

module.exports = {
    name: 'checkbirthday',
    aliases: ['checkbirth', 'birthdaylist','xemsinhnhat'],
    description: 'Xem danh sách sinh nhật theo tháng hoặc toàn bộ',

    async execute(message, args) {
         // 1. KIỂM TRA QUYỀN ADMIN
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) || !DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} | Chỉ **Quản trị viên** mới có quyền thiết lập ngày sinh nhật trên hệ thống!`);
        }
        
        const target = message.mentions.users.first();
        const monthQuery = parseInt(args[0]);
        const isMonthSearch = !isNaN(monthQuery) && monthQuery >= 1 && monthQuery <= 12;

        // 1. Xem riêng 1 người
        if (target) {
            const birthday = await getKey(renderKey("user_birthday", target.id));
            if (!birthday) return message.reply(`${errorIcon} | **${target.username}** chưa đặt ngày sinh.`);
            return message.reply(`📅 Sinh nhật của **${target.username}** là: **${birthday}**`);
        }

        try {
            // Gửi thông báo chờ để người dùng không tưởng bot bị lỗi
            const processingMsg = await message.reply("🔍 Đang lục tìm danh sách sinh nhật...");

            // 2. Lấy danh sách member từ Cache (Nhanh hơn fetch)
            // Nếu cache trống, bot sẽ cố gắng fetch nhưng giới hạn thời gian
            let members = message.guild.members.cache;
            if (members.size <= 1) { 
                members = await message.guild.members.fetch({ time: 5000 }).catch(() => null);
            }

            if (!members) {
                return processingMsg.edit(`${errorIcon} | Không thể lấy danh sách thành viên. Admin hãy bật 'Server Members Intent' trong Developer Portal!`);
            }

            let birthdayList = [];

            // 3. Quét dữ liệu
            for (const [id, member] of members) {
                if (member.user.bot) continue;

                const birthday = await getKey(renderKey("user_birthday", id));
                if (birthday && birthday.includes('/')) {
                    const [d, m] = birthday.split('/').map(Number);
                    
                    if (isMonthSearch) {
                        if (m === monthQuery) birthdayList.push({ name: member.user.username, date: birthday, d, m });
                    } else if (args.length === 0) {
                        birthdayList.push({ name: member.user.username, date: birthday, d, m });
                    }
                }
            }

            // 4. Sắp xếp theo tháng/ngày
            birthdayList.sort((a, b) => a.m - b.m || a.d - b.d);

            const embed = new EmbedBuilder()
                .setTitle(isMonthSearch ? `🎂 SINH NHẬT THÁNG ${monthQuery} 🎂` : '🎂 DANH SÁCH SINH NHẬT 🎂')
                .setColor(isMonthSearch ? '#3498db' : '#00FF99')
                .setTimestamp();

            if (birthdayList.length === 0) {
                embed.setDescription(isMonthSearch ? `Trống...` : `Chưa có ai đăng ký sinh nhật.`);
            } else {
                embed.setDescription(birthdayList.map(b => `• **${b.name}**: ${b.date}`).join('\n'));
            }

            await processingMsg.delete().catch(() => null);
            return message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply(`${errorIcon} | Lỗi hệ thống: Members didn't arrive in time.`);
        }
    },
};