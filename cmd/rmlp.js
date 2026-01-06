const { renderKey, getKey, setKey } = require('../utils/db');
const { errorIcon } = require("../utils/icon");
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: "removelovepoint",
    aliases: ["rmlp"],
    async execute(message, args) {
        // --- THIẾT LẬP QUYỀN DEVELOPER ---
        if (!DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} Lệnh này chỉ dành cho Developer!`);
        }

        // --- KIỂM TRA ĐẦU VÀO ---
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!target || isNaN(amount) || amount <= 0) {
            return message.reply(`⚠️ Cách dùng: \`.rmlp @user <số_điểm>\``);
        }

        const guildId = message.guild.id;
        const coupleKey = renderKey('couple', guildId);
        let couplesList = (await getKey(coupleKey)) || [];

        // --- XỬ LÝ DỮ LIỆU ---
        const coupleIndex = couplesList.findIndex(c => c.husband === target.id || c.wife === target.id);

        if (coupleIndex === -1) {
            return message.reply(`❌ Người dùng này hiện không có trong mối quan hệ nào.`);
        }

        const currentPoints = couplesList[coupleIndex].lovePoints || 0;
        
        // Trừ điểm (đảm bảo không nhỏ hơn 0)
        const newPoints = Math.max(0, currentPoints - amount);
        couplesList[coupleIndex].lovePoints = newPoints;

        // Lưu vào database
        await setKey(coupleKey, couplesList);

        return message.reply({
            content: `✅ Đã trừ **${amount.toLocaleString()}** điểm của cặp đôi <@${couplesList[coupleIndex].husband}> & <@${couplesList[coupleIndex].wife}>.\n💖 Điểm hiện tại: **${newPoints.toLocaleString()}**`,
            allowedMentions: { parse: [] } // Tránh ping lại người dùng
        });
    }
};