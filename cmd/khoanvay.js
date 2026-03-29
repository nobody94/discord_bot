const { EmbedBuilder } = require('discord.js');
const { getIcon } = require('../utils/currency.js');
const { errorIcon } = require('../utils/icon.js');
const { renderKey, getKey } = require('../utils/db.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'khoanvay',
    aliases: ['checkvay', 'kv'],
    description: 'Kiểm tra danh sách các khoản vay.',

    async execute(message, args) {
        try {
            const loanKey = renderKey("loan", message.guild.id);
            const allLoans = await getKey(loanKey);

            if (!allLoans || allLoans.length === 0) {
                return message.reply(`Hiện tại server không có dữ liệu khoản vay nào.`);
            }

            const isViewAll = args[0]?.toLowerCase() === 'all';
            let displayLoans = [];
            let title = "";

            if (isViewAll) {
                if (!DEVELOPER_IDS.includes(message.author.id)) {
                    return message.reply({
                        content: `${errorIcon} | Bạn không có quyền xem toàn bộ khoản vay trong server.`,
                        ephemeral: true
                    });
                }
                displayLoans = allLoans;
                title = `📋 TOÀN BỘ KHOẢN VAY - ${message.guild.name.toUpperCase()}`;
            } else {
                displayLoans = allLoans.filter(l =>
                    l.nguoi_vay === message.author.id ||
                    l.nguoi_cho_vay === message.author.id
                );
                title = `📋 KHOẢN VAY CỦA ${message.author.username.toUpperCase()}`;
            }

            if (displayLoans.length === 0) {
                return message.reply(`Bạn không có khoản vay nào hiện tại.`);
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(isViewAll ? 0x0099FF : 0xFFAA00)
                .setTimestamp();

            let description = "";
            displayLoans.forEach((loan, index) => {
                const dateObj = new Date(loan.date);
                const now = new Date();
                
                // Tính số ngày nợ
                const diffTime = Math.abs(now - dateObj);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                const dateDisplay = !isNaN(dateObj)
                    ? dateObj.toLocaleDateString('vi-VN')
                    : loan.date;

                description += `**${index + 1}.** <@${loan.nguoi_vay}> vay <@${loan.nguoi_cho_vay}>\n`;
                description += `> 💸 Số tiền: **${loan.money.toLocaleString()}** ${getIcon('mora')}\n`;
                description += `> 🗓️ Ngày: \`${dateDisplay}\` (${diffDays} ngày trước)\n`;

                // Thêm dòng lưu ý nếu nợ quá 3 ngày
                if (diffDays >= 3) {
                    description += `> ⚠️ **Lưu ý:** *Nợ quá quá hạn (trên 3 ngày)*\n`;
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