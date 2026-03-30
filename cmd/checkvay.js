const { EmbedBuilder } = require('discord.js');
const { getIcon } = require('../utils/currency.js');
const { errorIcon } = require('../utils/icon.js');
const { renderKey, getKey } = require('../utils/db.js');
const { DEVELOPER_IDS,calculateInterest } = require('../utils/constant.js');

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
                if (!isDev) return message.reply(`${errorIcon} | Bạn không có quyền xem toàn bộ khoản vay.`);
                displayLoans = allLoans;
                title = `📋 TOÀN BỘ KHOẢN VAY - ${message.guild.name.toUpperCase()}`;
            } 
            else if (targetUser) {
                displayLoans = allLoans.filter(l => l.nguoi_vay === targetUser.id || l.nguoi_cho_vay === targetUser.id);
                title = `📋 KHOẢN VAY CỦA ${targetUser.username.toUpperCase()}`;
            } 
            else {
                displayLoans = allLoans.filter(l => l.nguoi_vay === message.author.id || l.nguoi_cho_vay === message.author.id);
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
                // Sử dụng hàm dùng chung để tính lãi suất hiện tại
                const { rate, days } = calculateInterest(loan.date);
                const interestAmount = Math.round(loan.money * rate);
                const totalDebt = loan.money + interestAmount;

                const dateObj = new Date(loan.date);
                const dateDisplay = !isNaN(dateObj) ? dateObj.toLocaleDateString('vi-VN') : "Không rõ";

                description += `**${index + 1}.** <@${loan.nguoi_vay}> nợ <@${loan.nguoi_cho_vay}>\n`;
                description += `> 💰 Tổng nợ: **${totalDebt.toLocaleString()}** ${getIcon('mora')}\n`;
                description += `> 💵 Gốc: \`${loan.money.toLocaleString()}\` | 📈 Lãi: \`${(rate * 100).toFixed(0)}%\` (+${interestAmount.toLocaleString()})\n`;
                description += `> 🗓️ Ngày vay: \`${dateDisplay}\` (<t:${Math.floor(dateObj.getTime() / 1000)}:R>)\n`;

                if (days >= 3) {
                    description += `> ⚠️ **Cảnh báo:** Khoản nợ đã quá hạn ${days} ngày.\n`;
                }
                description += `\n`;
            });

            embed.setDescription(description);
            embed.setFooter({ text: "Dùng .trano <STT> [số tiền] để thanh toán." });
            
            return message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("LỖI LỆNH KHOANVAY:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi khi truy xuất dữ liệu.`);
        }
    },
};