const { renderKey, getKey, setKey } = require('../utils/db');
const { errorIcon } = require("../utils/icon");
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: "lovepoint",
    aliases: ["lp"],
    async execute(message, args) {
        // --- THIẾT LẬP QUYỀN DEVELOPER ---
        if (!DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} Lệnh này chỉ dành cho Developer!`);
        }

        // --- KIỂM TRA ĐẦU VÀO ---
        // Cấu trúc: .lp <add/remove/rm> <@user> <amount>
        const action = args[0]?.toLowerCase();
        const target = message.mentions.users.first();
        const amount = parseInt(args[2]);

        const usageHelp = `⚠️ Cách dùng:\n\`.lp add @user <số_điểm>\`\n\`.lp remove @user <số_điểm>\``;

        if (!['add', 'remove', 'rm'].includes(action) || !target || isNaN(amount) || amount <= 0) {
            return message.reply(usageHelp);
        }

        const guildId = message.guild.id;
        const coupleKey = renderKey('couple', guildId);
        let couplesList = (await getKey(coupleKey)) || [];

        // --- XỬ LÝ DỮ LIỆU ---
        const coupleIndex = couplesList.findIndex(c => c.husband === target.id || c.wife === target.id);

        if (coupleIndex === -1) {
            return message.reply(`❌ Người dùng này hiện không trong mối quan hệ nào.`);
        }

        const currentPoints = couplesList[coupleIndex].lovePoints || 0;
        let newPoints;
        let actionText;

        if (action === 'add') {
            newPoints = currentPoints + amount;
            actionText = "Cộng";
        } else {
            // Trường hợp remove hoặc rm
            newPoints = Math.max(0, currentPoints - amount);
            actionText = "Trừ";
        }

        // Cập nhật điểm
        couplesList[coupleIndex].lovePoints = newPoints;

        // Lưu vào database
        await setKey(coupleKey, couplesList);

        return message.reply({
            content: `✅ Đã **${actionText} ${amount.toLocaleString()}** điểm của cặp đôi <@${couplesList[coupleIndex].husband}> & <@${couplesList[coupleIndex].wife}>.\n💖 Điểm hiện tại: **${newPoints.toLocaleString()}**`,
            allowedMentions: { parse: [] } 
        });
    }
};