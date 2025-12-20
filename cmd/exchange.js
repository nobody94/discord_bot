const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { getIcon, getBalance, removeMoney, addMoney } = require("../utils/currency");
const { verifyIcon, errorIcon } = require('../utils/icon');

module.exports = {
    name: "exchange",
    aliases: ["convert", "doitien"],
    description: "Giao diện chuyển đổi giữa Mora và Nguyên Thạch",

    async execute(message, args) {
        const RATE = 10000; // 1 Primo = 10,000 Mora

        const embed = new EmbedBuilder()
            .setTitle("🏦 Ngân Hàng Bắc Quốc")
            .setColor(0xFFD700)
            .setDescription(
                `Chào mừng bạn đến với Ngân Hàng Bắc Quốc!\n\n` +
                `**Tỷ giá quy đổi:**\n` +
                `• 1 ${getIcon('primo')} ➔ **${RATE.toLocaleString()}** ${getIcon('mora')}\n` +
                `• ${RATE.toLocaleString()} ${getIcon('mora')} ➔ **1** ${getIcon('primo')}\n\n` +
                `*Vui lòng chọn loại giao dịch bên dưới.*`
            )
            .setFooter({ text: "Giao dịch an toàn và nhanh chóng" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('exchange_mora_to_primo')
                .setLabel(`Mora ➔ Nguyên thạch`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('exchange_primo_to_mora')
                .setLabel(`Nguyên thạch ➔ Mora`)
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        const RATE = 10000;
        const userId = interaction.user.id;

        // --- 1. XỬ LÝ KHI NHẤN NÚT (MỞ MODAL) ---
        if (interaction.isButton()) {
            const isMoraToPrimo = interaction.customId === 'exchange_mora_to_primo';

            const modal = new ModalBuilder()
                .setCustomId(isMoraToPrimo ? 'exchange_modal_mora_to_primo' : 'exchange_modal_primo_to_mora')
                .setTitle(isMoraToPrimo ? 'Đổi Mora sang Nguyên Thạch' : 'Đổi Nguyên Thạch sang Mora');

            const amountInput = new TextInputBuilder()
                .setCustomId('exchange_amount')
                .setLabel(isMoraToPrimo ? "Số lượng Nguyên Thạch muốn nhận" : "Số lượng Nguyên Thạch muốn đổi")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(isMoraToPrimo ? "Ví dụ: 10 (tốn 100,000 Mora)" : "Ví dụ: 10 (nhận 100,000 Mora)")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
            await interaction.showModal(modal);
        }

        // --- 2. XỬ LÝ KHI GỬI MODAL (XÁC NHẬN GIAO DỊCH) ---
        if (interaction.isModalSubmit()) {
            const amount = parseInt(interaction.fields.getTextInputValue('exchange_amount'));

            // Tránh lỗi "Interaction Failed" bằng cách defer trước
            await interaction.deferReply({ ephemeral: true });

            if (isNaN(amount) || amount <= 0) {
                return interaction.editReply({ content: `${errorIcon} | Số lượng không hợp lệ!` });
            }

            let success = false;
            let messageOutput = "";

            // A. Đổi MORA sang PRIMO
            if (interaction.customId === 'exchange_modal_mora_to_primo') {
                const totalMoraNeeded = amount * RATE;
                const currentMora = await getBalance(userId, 'mora') || 0;

                if (currentMora < totalMoraNeeded) {
                    return interaction.editReply({ content: `${errorIcon} | Bạn không đủ Mora!` });
                }

                await removeMoney(userId, totalMoraNeeded, 'mora');
                await addMoney(userId, amount, 'primo');
                success = true;
                messageOutput = `${verifyIcon} | Đã đổi **${totalMoraNeeded.toLocaleString()}** Mora lấy **${amount}** Primo.`;
            }

            // B. Đổi PRIMO sang MORA
            if (interaction.customId === 'exchange_modal_primo_to_mora') {
                const currentPrimo = await getBalance(userId, 'primo') || 0;

                if (currentPrimo < amount) {
                    return interaction.editReply({ content: `${errorIcon} | Bạn không đủ Nguyên Thạch!` });
                }

                const totalMoraReceived = amount * RATE;
                await removeMoney(userId, amount, 'primo');
                await addMoney(userId, totalMoraReceived, 'mora');
                success = true;
                messageOutput = `${verifyIcon} | Đã đổi **${amount}** Primo lấy **${totalMoraReceived.toLocaleString()}** Mora.`;
            }

            // --- BƯỚC QUAN TRỌNG: ENABLE LẠI NÚT BẤM ---
            if (success) {
                // Tạo lại hàng nút bấm giống hệt lúc đầu
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('exchange_mora_to_primo')
                        .setLabel(`Mora ➔ Nguyên thạch`)
                        .setStyle(ButtonStyle.Success)                        
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('exchange_primo_to_mora')
                        .setLabel(`Nguyên thạch ➔ Mora`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

                // Cập nhật lại tin nhắn gốc để các nút sáng lên (Enabled)
                await interaction.message.edit({ components: [row] }).catch(() => null);

                // Phản hồi kết quả cho người dùng
                return interaction.editReply({ content: messageOutput });
            }
        }
    }
};