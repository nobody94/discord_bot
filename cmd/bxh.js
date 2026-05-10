const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, getIcon } = require('../utils/currency');
const { getKey } = require("../utils/db");
const { checkCooldown, getCountdown } = require('../utils/cooldown');

module.exports = {
    name: "top",
    description: 'Xem bảng xếp hạng đại gia trong server.',
    aliases: ['bxh'],
    async execute(message, args) {
        // 1. Kiểm tra Cooldown
        const cooldownTime = 60;
        if (checkCooldown(message.author.id, this.name, cooldownTime)) {
            const timeString = getCountdown(message.author.id, this.name, cooldownTime);
            return message.reply(`⏳ | Bạn đang thao tác quá nhanh! Thử lại sau **${timeString}**.`)
                .then(msg => setTimeout(() => msg.delete().catch(() => null), 5000));
        }

        const serverUserIds = (await getKey("all_users")) || [];
        if (serverUserIds.length === 0) return message.reply("❌ Danh sách xếp hạng hiện đang trống!");

        const processingMsg = await message.reply("⏳ Đang thu thập dữ liệu tài chính toàn server...");

        // 2. Lấy toàn bộ dữ liệu Mora và Primo của tất cả user trong 1 lần duy nhất
        const allData = await Promise.all(
            serverUserIds.map(async (userId) => {
                const [mora, primo] = await Promise.all([
                    getBalance(userId, 'mora'),
                    getBalance(userId, 'primo')
                ]);
                return { userId, mora, primo };
            })
        );

        // 3. Hàm tạo Embed chỉ việc lấy từ biến `allData` đã có sẵn
        const generateEmbed = (type) => {
            const top10 = [...allData]
                .sort((a, b) => b[type] - a[type])
                .slice(0, 10);

            const entries = top10.map((d, i) => {
                const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                return `${rankIcon} | <@${d.userId}>: **${d[type].toLocaleString()}** ${getIcon(type)}`;
            });

            return new EmbedBuilder()
                .setColor(type === 'mora' ? 0xFFCC00 : 0x00FFFF)
                .setTitle(`🏆 BẢNG XẾP HẠNG GIÀU CÓ (${type.toUpperCase()})`)
                .setDescription(entries.join('\n') || "Chưa có dữ liệu")
                .setFooter({ text: `Trang: ${type === 'mora' ? '1/2' : '2/2'} • Yêu cầu bởi ${message.author.username}` })
                .setTimestamp();
        };

        // 4. Các nút bấm
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('top_mora').setLabel('Mora').setEmoji(getIcon('mora')).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('top_primo').setLabel('Primo').setEmoji(getIcon('primo')).setStyle(ButtonStyle.Success)
        );

        // Hiển thị mặc định trang Mora
        const mainMsg = await processingMsg.edit({ 
            content: null, 
            embeds: [generateEmbed('mora')], 
            components: [buttons] 
        });

        // 5. Bộ thu thập sự kiện nhấn nút
        const collector = mainMsg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 60000 
        });

        collector.on('collect', async interaction => {
            const type = interaction.customId === 'top_mora' ? 'mora' : 'primo';
            // Không cần await getBalance nữa, chỉ cần gọi hàm tạo giao diện
            await interaction.update({ embeds: [generateEmbed(type)] });
        });

        collector.on('end', () => {
            const disabledButtons = new ActionRowBuilder().addComponents(
                buttons.components.map(button => ButtonBuilder.from(button).setDisabled(true))
            );
            mainMsg.edit({ components: [disabledButtons] }).catch(() => null);
        });
    }
};