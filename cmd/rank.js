const { RANKS, getRankByXp } = require('../utils/rank.js');
const { getKey, setKey } = require("../utils/db");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { checkCooldown } = require('../utils/cooldown');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "rank",
    description: 'Xem bảng xếp hạng tu tiên.',
    async execute(message, args) {
        const guildId = message.guild.id;
        if (checkCooldown(message.author.id, 'checkrank', 60)) {
            return message.reply("⏳ | Bạn đang thao tác quá nhanh! Vui lòng đợi vài giây để tiếp tục xem bảng xếp hạng.")
                .then(msg => setTimeout(() => msg.delete().catch(() => null), 5000));
        }

        const targetUser = message.mentions.users.first();
        if (targetUser) {
            if (targetUser.bot) return;

            const xpKey = `xp_${guildId}_${targetUser.id}`;
            const totalXp = (await getKey(xpKey)) || 0;
            const userRankName = getRankByXp(totalXp);
            const userAvatar = targetUser.displayAvatarURL({ dynamic: true, size: 512 });

            // Tìm xem người này cần bao nhiêu EXP nữa để đột phá cấp tiếp theo
            let nextRankText = "Đã đạt đến đỉnh phong chi cảnh!";
            const currentRankIndex = RANKS.findIndex(r => r.name === userRankName);
            if (currentRankIndex !== -1 && currentRankIndex < RANKS.length - 1) {
                const nextRank = RANKS[currentRankIndex + 1];
                const xpNeeded = nextRank.requiredXp - totalXp;
                nextRankText = `Cần tích lũy thêm **${xpNeeded.toLocaleString()}** EXP để đột phá ${nextRank.name}`;
            }

            const profileEmbed = new EmbedBuilder()
                .setColor("#00FFFF")
                .setTitle(`🔮 THÔNG TIN TU VI - ${targetUser.username.toUpperCase()}`)
                .setThumbnail(userAvatar)
                .addFields(
                    { name: "Cảnh Giới Hiện Tại", value: `\`${userRankName}\``, inline: true },
                    { name: "Tổng Tích Lũy", value: `\`${totalXp.toLocaleString()} EXP\``, inline: true },
                    { name: "Con Đường Đột Phá", value: nextRankText, inline: false }
                )
                .setFooter({ text: `Yêu cầu bởi ${message.author.username}` })
                .setTimestamp();

            return message.reply({ embeds: [profileEmbed] });
        }

        const serverUserIds = (await getKey("all_users")) || [];
        if (serverUserIds.length === 0) return message.reply("❌ Phong Thần Bảng hiện đang trống rỗng!");

        const processingMsg = await message.reply("🔮 Đang bấm quẻ, thu thập linh khí toàn server...");

        const allData = await Promise.all(
            serverUserIds.map(async (userId) => {
                const xpKey = `xp_${guildId}_${userId}`;
                const totalXp = (await getKey(xpKey)) || 0;
                return { userId, totalXp };
            })
        );

        const top10 = allData
            .filter(d => d.totalXp > 0)
            .sort((a, b) => b.totalXp - a.totalXp)
            .slice(0, 10);

        if (top10.length === 0) {
            return processingMsg.edit("❌ Chưa có ai bắt đầu con đường tu tiên (0 EXP)!");
        }

        const entries = top10.map((d, i) => {
            const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
            const userRankName = getRankByXp(d.totalXp);
            return `${rankIcon} | <@${d.userId}>\n┕  Cảnh Giới: \`${userRankName}\` • Tu Vi: **${d.totalXp.toLocaleString()}** EXP`;
        });

        const embed = new EmbedBuilder()
            .setColor("#FFD700")
            .setTitle("🏆 PHONG THẦN BẢNG - TOP 10 ĐẠI NĂNG TU TIÊN")
            .setDescription(entries.join('\n\n'))
            .setFooter({ text: `Gõ lệnh kèm tag ai đó để check rank riêng (Ví dụ: .rank @user)` })
            .setTimestamp();

        await processingMsg.edit({
            content: null,
            embeds: [embed]
        });
    }
}