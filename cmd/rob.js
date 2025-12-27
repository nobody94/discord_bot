const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { getBalance, addMoney, removeMoney, getIcon } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: "rob",
    aliases: ["cuoptien", "ct"],
    description: "Khởi động một phi vụ cướp ngân hàng",
    async execute(message, args) {
        // 1. KIỂM TRA QUYỀN (Dev hoặc Quản lý kênh)
        const isDev = DEVELOPER_IDS.includes(message.author.id);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.ManageChannels);

        if (!isDev && !isAdmin) {
            return message.reply(`${errorIcon} | Chỉ Dev hoặc Quản lý kênh mới có thể phát động phi vụ này!`);
        }

        let participants = new Set();
        participants.add(message.author.id);

        const bankVault = Math.floor(Math.random() * (2000000 - 500000 + 1)) + 500000; // 500k - 2M Mora

        // Công thức tính tỉ lệ: 1 người = 5%. Mỗi người thêm vào +5%. Max 70%.
        const calculateChance = (count) => Math.min(5 + (count - 1) * 5, 70);

        const embed = new EmbedBuilder()
            .setTitle("🏦 PHI VỤ CƯỚP NGÂN HÀNG BẮC QUỐC")
            .setColor("#ff0000")
            .setDescription(`**${message.author.username}** đã phát động phi vụ!\n\n` +
                `💰 **Giá trị hầm:** ~${bankVault.toLocaleString()} ${getIcon('mora')}\n` +
                `👥 **Đồng bọn:** ${participants.size} người\n` +
                `🎯 **Tỉ lệ thành công:** ${calculateChance(participants.size)}%\n\n` +
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
                    `👥 **Đồng bọn:** ${participants.size} người\n` +
                    `🎯 **Tỉ lệ thành công:** ${currentChance}%`);
                await interaction.update({ embeds: [embed] });
            }

            if (interaction.customId === 'start_rob') {
                if (interaction.user.id !== message.author.id && !isDev) return interaction.reply({ content: "Chỉ chủ mưu mới có thể bắt đầu!", ephemeral: true });
                await interaction.deferUpdate();
                collector.stop('started');
            }

            if (interaction.customId === 'cancel_rob') {
                if (interaction.user.id !== message.author.id && !isDev) return interaction.reply({ content: "Bạn không thể hủy!", ephemeral: true });
                collector.stop('cancelled');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'cancelled') return msg.edit({ content: "❌ Phi vụ đã bị hủy.", embeds: [], components: [] });
            if (reason === 'time' && participants.size < 1) return msg.edit({ content: "⏰ Hết thời gian chuẩn bị.", embeds: [], components: [] });

            if (reason === 'started') {
                // --- GIAI ĐOẠN 10S ĐẾM NGƯỢC ---
                let timeLeft = 10;
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );

                const fightEmbed = new EmbedBuilder()
                    .setTitle("🚨 ĐANG ĐỘT NHẬP NGÂN HÀNG...")
                    .setColor("#f39c12")
                    .setDescription(`Các tay súng đang nổ súng khống chế bảo vệ!\n\n⏳ Kết quả sau: **${timeLeft} giây**\n👥 Quân số: **${participants.size}** người.`);

                await msg.edit({ embeds: [fightEmbed], components: [disabledRow] });

                const countdown = setInterval(async () => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        fightEmbed.setDescription(`Các tay súng đang nổ súng khống chế bảo vệ!\n\n⏳ Kết quả sau: **${timeLeft} giây**\n👥 Quân số: **${participants.size}** người.`);
                        await msg.edit({ embeds: [fightEmbed] }).catch(() => clearInterval(countdown));
                    } else {
                        clearInterval(countdown);
                        
                        // --- KẾT QUẢ CUỐI CÙNG ---
                        const finalChance = calculateChance(participants.size);
                        const isSuccess = Math.random() * 100 < finalChance;
                        const resultEmbed = new EmbedBuilder().setTitle("🚨 KẾT QUẢ PHI VỤ");

                        if (isSuccess) {
                            const individualShare = Math.floor(bankVault / participants.size);
                            for (const pId of participants) {
                                await addMoney(pId, individualShare, 'mora');
                            }
                            resultEmbed.setColor("#2ecc71")
                                .setDescription(`🎉 **THÀNH CÔNG RỰC RỠ!**\n\nNhóm đã khoét vách thành công hầm ngân hàng!\n💰 Tổng thu: **${bankVault.toLocaleString()}** ${getIcon('mora')}\n💰 Mỗi người chia nhau: **${individualShare.toLocaleString()}** ${getIcon('mora')}`);
                        } else {
                            const fine = 2000; // Phạt 2k nếu bị bắt
                            for (const pId of participants) {
                                await removeMoney(pId, fine, 'mora').catch(() => {});
                            }
                            resultEmbed.setColor("#e74c3c")
                                .setDescription(`🚔 **PHI VỤ THẤT BẠI!**\n\nCảnh sát đặc nhiệm đã ập vào tóm gọn cả nhóm.\n💸 Mỗi người tốn **${fine.toLocaleString()}** ${getIcon('mora')} để tại ngoại.\n🎯 Tỉ lệ thành công lúc đó là ${finalChance}%, đen thôi đỏ quên đi.`);
                        }
                        await msg.edit({ embeds: [resultEmbed], components: [] });
                    }
                }, 1000);
            }
        });
    }
};