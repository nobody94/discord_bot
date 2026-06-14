const { getKey, setKey } = require("../utils/db");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { checkCooldown } = require('../utils/cooldown');
const { EmbedBuilder } = require('discord.js');
const { RANKS,getRankByXp } = require('../utils/rank.js');

const LEVEL_UP_CHANNEL_ID = "1449207210503835771";

async function chatRankHandle(message) {
    if (!message.guild || message.author.bot) return;

    if (checkCooldown(message.author.id, 'chatRank', 5)) {
        return;
    }

    const userId = message.author.id;
    const guildId = message.guild.id;
    const xpKey = `xp_${guildId}_${userId}`;
    const rankKey = `current_rank_${guildId}_${userId}`;

    let currentXp = (await getKey(xpKey)) || 0;
    let oldRank = (await getKey(rankKey)) || RANKS[0].name;

    const xpToAdd = 3;
    currentXp += xpToAdd;

    let newRank = getRankByXp(currentXp);

    await setKey(xpKey, currentXp);
     
    if (newRank !== oldRank) {
        await setKey(rankKey, newRank);      
        try {            
            const targetChannel = message.guild.channels.cache.get(LEVEL_UP_CHANNEL_ID);
            const userAvatar = message.author.displayAvatarURL({ dynamic: true, size: 512 });
            const levelUpMsg = new EmbedBuilder()
                .setTitle("🎉 Đột phá cảnh giới")
                .setColor("#FFD700")
                .setThumbnail(userAvatar)
                .setDescription(`**Đạo hữu <@${userId}> vừa có một màn đột phá**\nCảnh giới **${newRank}**!`);
                
            if (targetChannel) {
                await targetChannel.send({ embeds: [levelUpMsg] });
            } else {
                // Nếu không tìm thấy kênh (sai ID), bot sẽ tự động gửi trả lời tại chỗ như cũ
                await message.reply({ embeds: [levelUpMsg] });
            }
        } catch (err) {
            console.error("Không thể gửi tin nhắn thông báo lên cấp:", err);
        }
    }
}

module.exports = { chatRankHandle };