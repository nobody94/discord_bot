const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getIcon,getBalance,removeMoney,addMoney } = require("../utils/currency");
const {verifyIcon,errorIcon} = require('../utils/icon');

module.exports = {
    name: "exchange",
    aliases: ["convert", "doitien"],
    description: "Giao diện chuyển đổi Mora sang Nguyên Thạch",

    async execute(message, args) {
        const RATE = 10000;

        const embed = new EmbedBuilder()
            .setTitle("🏦 Ngân Hàng Bắc Quốc")
            .setColor(0xFFD700)
            .setDescription(`Chào mừng bạn đến với Ngân Hàng Bắc Quốc!\n\n**Tỷ giá hiện tại:**\n${RATE.toLocaleString()} ${getIcon('mora')} = 1 ${getIcon('primo')}`)
            .setFooter({ text: "Nhấn nút bên dưới để bắt đầu giao dịch" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_exchange_modal')
                .setLabel('Bắt đầu đổi')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄')
        );

        // Chỉ gửi tin nhắn kèm nút, việc xử lý nút đã có index.js lo
        await message.reply({ embeds: [embed], components: [row] });
    },

    // Hàm này sẽ được index.js gọi khi có tương tác
    async handleInteraction(interaction) {
        if (interaction.isButton()) {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
            const modal = new ModalBuilder()
                .setCustomId('exchange_modal') // Phải khớp với customId trong index.js
                .setTitle('Đổi Mora sang Nguyên Thạch');

            const amountInput = new TextInputBuilder()
                .setCustomId('primo_amount')
                .setLabel("Số lượng Nguyên Thạch muốn nhận")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Nhập số lượng, ví dụ: 10")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            const amountStr = interaction.fields.getTextInputValue('primo_amount');
            const amount = parseInt(amountStr);
            const userId = interaction.user.id;
            const RATE = 10000;

            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ content: `${errorIcon} | Số lượng không hợp lệ!`, ephemeral: true });
            }

            const currentMora = await getBalance(userId, 'mora') || 0;
            const totalMoraNeeded = amount * RATE;

            if (currentMora < totalMoraNeeded) {
                return interaction.reply({
                    content: `${errorIcon} | Bạn không đủ Mora! Cần **${totalMoraNeeded.toLocaleString()}** ${getIcon("mora")} để đổi.`,
                    ephemeral: true
                });
            }

            await removeMoney(userId, totalMoraNeeded, 'mora');
            await addMoney(userId, amount, 'primo');

            return interaction.reply({
                content: `${verifyIcon} | **Giao dịch thành công!**\n Đã dùng: **${totalMoraNeeded.toLocaleString()}** ${getIcon("mora")}\n Nhận được: **${amount.toLocaleString()}** ${getIcon("primo")}`,
                ephemeral: false
            });
        }
    }
};