const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { getBalance, addMoney, removeMoney, getIcon } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: "rob",
    aliases: ["cuoptien", "ct"],
    description: "Khởi động một phi vụ cướp ngân hàng",
    async execute(message, args) {
        const isDev = DEVELOPER_IDS.includes(message.author.id);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.ManageChannels);

        if (!isDev && !isAdmin) {
            return message.reply(`${errorIcon} | Chỉ Dev hoặc Quản lý kênh mới có thể phát động phi vụ này!`);
        }

        let participants = new Set();
        participants.add(message.author.id);
        const bankVault = Math.floor(Math.random() * (2000000 - 500000 + 1)) + 500000;

        const calculateChance = (count) => Math.min(5 + (count - 1) * 15, 90);

        // Hàm tạo danh sách tag người dùng
        const getMentions = () => Array.from(participants).map(id => `<@${id}>`).join(", ");

        const embed = new EmbedBuilder()
            .setTitle("🏦 PHI VỤ CƯỚP NGÂN HÀNG BẮC QUỐC")
            .setColor("#ff0000")
            .setDescription(`**${message.author.username}** đã phát động phi vụ!\n\n` +
                `💰 **Giá trị hầm:** ~${bankVault.toLocaleString()} ${getIcon('mora')}\n` +
                `🎯 **Tỉ lệ thành công:** ${calculateChance(participants.size)}%\n\n` +
                `👥 **Đồng bọn tham gia:**\n${getMentions()}\n\n` +
                `*Nhấn nút để tham gia. Càng đông tỉ lệ thắng càng cao!*`)
            .setFooter({ text: "Phi vụ tự hủy sau 2 phút nếu không bắt đầu." });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join_rob').setLabel('Tham Gia').setStyle(ButtonStyle.Primary).setEmoji('👥'),
            new ButtonBuilder().setCustomId('start_rob').setLabel('Bắt Đầu').setStyle(ButtonStyle.Success).setEmoji('🔫'),
            new ButtonBuilder().setCustomId('cancel_rob').setLabel('Hủy').setStyle(ButtonStyle.Danger).setEmoji('✖️')
        );

        const msg = await message.reply({ embeds: [embed], components: [row] });
        const collector = msg.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'join_rob') {
                if (participants.has(interaction.user.id)) return interaction.reply({ content: "Bạn đã tham gia rồi!", ephemeral: true });
                participants.add(interaction.user.id);
                
                const currentChance = calculateChance(participants.size);
                embed.setDescription(`**${message.author.username}** đã phát động phi vụ!\n\n` +
                    `💰 **Giá trị hầm:** ~${bankVault.toLocaleString()} ${getIcon('mora')}\n` +
                    `🎯 **Tỉ lệ thành công:** ${currentChance}%\n\n` +
                    `👥 **Đồng bọn tham gia:**\n${getMentions()}`);
                await interaction.update({ embeds: [embed] });
            }

            if (interaction.customId === 'start_rob') {
                if (interaction.user.id !== message.author.id && !isDev) return interaction.reply({ content: "Chỉ chủ mưu mới có thể bắt đầu!", ephemeral: true });
                await interaction.deferUpdate(); // Khắc phục lỗi "Interaction failed"
                collector.stop('started');
            }

            if (interaction.customId === 'cancel_rob') {
                if (interaction.user.id !== message.author.id && !isDev) return interaction.reply({ content: "Bạn không thể hủy!", ephemeral: true });
                await interaction.deferUpdate(); // Khắc phục lỗi "Interaction failed"
                collector.stop('cancelled');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'cancelled') return msg.edit({ content: "❌ Phi vụ đã bị hủy.", embeds: [], components: [] });
            if (reason === 'time' && participants.size < 1) return msg.edit({ content: "⏰ Hết thời gian chuẩn bị.", embeds: [], components: [] });

            if (reason === 'started') {
                let timeLeft = 10;
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );

                const fightEmbed = new EmbedBuilder()
                    .setTitle("🚨 ĐANG ĐỘT NHẬP NGÂN HÀNG...")
                    .setColor("#f39c12")
                    .setDescription(`Các tay súng đang nổ súng khống chế bảo vệ!\n\n` +
                        `⏳ Kết quả sau: **${timeLeft} giây**\n` +
                        `👥 **Đội hình:** ${getMentions()}`);

                await msg.edit({ embeds: [fightEmbed], components: [disabledRow] });

                const countdown = setInterval(async () => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        fightEmbed.setDescription(`Các tay súng đang nổ súng khống chế bảo vệ!\n\n` +
                            `⏳ Kết quả sau: **${timeLeft} giây**\n` +
                            `👥 **Đội hình:** ${getMentions()}`);
                        await msg.edit({ embeds: [fightEmbed] }).catch(() => clearInterval(countdown));
                    } else {
                        clearInterval(countdown);
                        
                        const finalChance = calculateChance(participants.size);
                        const isSuccess = Math.random() * 100 < finalChance;
                        const resultEmbed = new EmbedBuilder().setTitle("🚨 KẾT QUẢ PHI VỤ");

                        if (isSuccess) {
                            const individualShare = Math.floor(bankVault / participants.size);
                            for (const pId of participants) {
                                await addMoney(pId, individualShare, 'mora');
                            }
                            resultEmbed.setColor("#2ecc71")
                                .setDescription(`🎉 **THÀNH CÔNG RỰC RỠ!**\n\nNhóm cướp đã tẩu thoát cùng **${bankVault.toLocaleString()}** ${getIcon('mora')}.\n\n` +
                                    `💰 Mỗi người nhận: **${individualShare.toLocaleString()}** ${getIcon('mora')}\n` +
                                    `👥 **Danh sách tay súng:** ${getMentions()}`);
                        } else {
                            const fine = 5000;
                            for (const pId of participants) {
                                await removeMoney(pId, fine, 'mora').catch(() => {});
                            }
                            resultEmbed.setColor("#e74c3c")
                                .setDescription(`🚔 **PHI VỤ THẤT BẠI!**\n\nCảnh sát đã bao vây và bắt gọn cả nhóm.\n\n` +
                                    `💸 Mỗi người tốn **${fine.toLocaleString()}** ${getIcon('mora')} để tại ngoại.\n` +
                                    `👥 **Danh sách bị bắt:** ${getMentions()}`);
                        }
                        await msg.edit({ embeds: [resultEmbed], components: [] });
                    }
                }, 1000);
            }
        });
    }
};