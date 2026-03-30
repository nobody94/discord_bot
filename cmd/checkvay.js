const { EmbedBuilder } = require('discord.js');
const { getIcon } = require('../utils/currency.js');
const { errorIcon } = require('../utils/icon.js');
const { renderKey, getKey } = require('../utils/db.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'khoanvay',
    aliases: ['checkvay', 'kv'],
    description: 'Kiểm tra danh sách các khoản vay của bản thân hoặc người khác.',

    async execute(message, args) {
        try {
            const loanKey = renderKey("loan", message.guild.id);
            const allLoans = (await getKey(loanKey)) || [];

            if (allLoans.length === 0) {
                return message.reply(`Hiện tại server không có dữ liệu khoản vay nào.`);
            }

            const isDev = DEVELOPER_IDS.includes(message.author.id);
            const targetUser = message.mentions.users.first();
            const isViewAll = args[0]?.toLowerCase() === 'all';

            let displayLoans = [];
            let title = "";

            // --- LOGIC LỌC DỮ LIỆU ---
            if (isViewAll) {
                // 1. Xem tất cả (Chỉ Dev)
                if (!isDev) return message.reply(`${errorIcon} | Bạn không có quyền xem toàn bộ khoản vay.`);
                displayLoans = allLoans;
                title = `📋 TOÀN BỘ KHOẢN VAY - ${message.guild.name.toUpperCase()}`;
            } 
            else if (targetUser) {
                // 2. Xem của người được tag
                displayLoans = allLoans.filter(l => 
                    l.nguoi_vay === targetUser.id || 
                    l.nguoi_cho_vay === targetUser.id
                );
                title = `📋 KHOẢN VAY CỦA ${targetUser.username.toUpperCase()}`;
            } 
            else {
                // 3. Tự xem bản thân
                displayLoans = allLoans.filter(l =>
                    l.nguoi_vay === message.author.id ||
                    l.nguoi_cho_vay === message.author.id
                );
                title = `📋 KHOẢN VAY CỦA ${message.author.username.toUpperCase()}`;
            }

            if (displayLoans.length === 0) {
                const name = targetUser ? targetUser.username : "Bạn";
                return message.reply(`${name} không có khoản vay nào hiện tại.`);
            }

            // --- RENDER EMBED ---
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(isViewAll ? 0x0099FF : 0xFFAA00)
                .setTimestamp();

            let description = "";
            displayLoans.forEach((loan, index) => {
                const dateObj = new Date(loan.date);
                const now = new Date();
                const diffTime = Math.abs(now - dateObj);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                const dateDisplay = !isNaN(dateObj) ? dateObj.toLocaleDateString('vi-VN') : "Không rõ";

                description += `**${index + 1}.** <@${loan.nguoi_vay}> vay <@${loan.nguoi_cho_vay}>\n`;
                description += `> 💸 Tiền: **${loan.money.toLocaleString()}** ${getIcon('mora')}\n`;
                description += `> 🗓️ Ngày: \`${dateDisplay}\` (${diffDays} ngày trước)\n`;

                if (diffDays >= 3) {
                    description += `> ⚠️ **Lưu ý:** *Nợ quá hạn (3+ ngày)*\n`;
                }
                description += `\n`;
            });

            embed.setDescription(description);
            return message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("LỖI LỆNH KHOANVAY:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi khi truy xuất dữ liệu.`);
        }
    },
};