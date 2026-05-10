const { EmbedBuilder } = require("discord.js");
const { renderKey, getKey } = require('../utils/db');

module.exports = {
    name: "couple",
    aliases: ["cp", "profiledoi"],
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const guildId = message.guild.id;

        const coupleKey = renderKey('couple', guildId);
        const couplesList = (await getKey(coupleKey)) || [];

        const coupleInfo = couplesList.find(c => c.husband === target.id || c.wife === target.id);

        if (!coupleInfo) {
            return message.reply(target.id === message.author.id ? "❌ Bạn hiện đang độc thân!" : `❌ **${target.username}** hiện đang độc thân.`);
        }

        const partnerId = coupleInfo.husband === target.id ? coupleInfo.wife : coupleInfo.husband;
        const lovePoints = coupleInfo.lovePoints || 0;

        // Xác định danh hiệu tình cảm dựa trên điểm
        let relationshipStatus = "Mới quen 🕒";
        if (lovePoints > 500000) relationshipStatus = "Bạc đầu giai lão 💍";
        else if (lovePoints > 100000) relationshipStatus = "Định mệnh an bài 🍾";
        else if (lovePoints > 50000) relationshipStatus = "Thề non hẹn biển 🌊";
        else if (lovePoints > 10000) relationshipStatus = "Mặn nồng 🔥";
        else if (lovePoints > 5000) relationshipStatus = "Gắn bó 💞";
        else if (lovePoints > 1000) relationshipStatus = "Tìm hiểu 🌹";

        const marriageDate = new Date(coupleInfo.date);
        const daysPassed = Math.floor(Math.abs(Date.now() - marriageDate.getTime()) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setTitle("💖 HỒ SƠ TÌNH DUYÊN")
            .setColor("#ff69b4")
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(`<@${coupleInfo.husband}> ❤️ <@${coupleInfo.wife}>`)
            .addFields(
                { name: "💍 Ngày kết hôn", value: marriageDate.toLocaleDateString('vi-VN'), inline: true },
                { name: "⏳ Bên nhau", value: `${daysPassed} ngày`, inline: true },
                { name: "💖 Thân mật", value: `${lovePoints.toLocaleString()} điểm`, inline: true },
                { name: "🏷️ Trạng thái", value: relationshipStatus, inline: true }
            )
            .setFooter({ text: "Hãy thường xuyên tặng quà cho nhau để tăng thân mật nhé!" });

        message.reply({ embeds: [embed] });
    }
};