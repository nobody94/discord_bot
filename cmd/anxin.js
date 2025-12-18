const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  name: "anxin",
  description: "Gửi yêu cầu xin tiền bằng popup",

  async execute(message) {
    // Tạo nút bấm
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("button_anxin")
        .setLabel("Nhấn để xin tiền")
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({
      content: "🙏 Bạn đang thiếu thốn? Hãy nhấn nút bên dưới để xin trợ cấp!",
      components: [row],
    });
  },
  async handleInteraction(interaction) {
    if (interaction.isButton() && interaction.customId === "button_anxin") {
      const modal = new ModalBuilder()
        .setCustomId("modal_anxin")
        .setTitle("Đơn Xin Trợ Cấp");

      const amountInput = new TextInputBuilder()
        .setCustomId("amount_anxin")
        .setLabel("Số tiền bạn muốn xin là bao nhiêu?")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: 100")
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(amountInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId === "modal_anxin") {
      const amountStr = interaction.fields.getTextInputValue("amount_anxin");
      const amount = parseInt(amountStr);

      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "❌ Số tiền không hợp lệ!",
          ephemeral: true,
        });
      }

      // Giới hạn xin tối đa để tránh lạm dụng (Ví dụ: 200)
      if (amount > 200) {
        return interaction.reply({
          content: "❌ Bạn tham quá! Chỉ xin được tối đa 200 thôi.",
          ephemeral: true,
        });
      }

      const userId = interaction.user.id;

      // Cộng tiền vào Database
      await Money.addMoney(userId, amount);

      await interaction.reply({
        content: `✅ Hệ thống đã duyệt đơn! **${
          interaction.user.username
        }** vừa xin được **${amount}** ${Money.getIcon()}!`,
      });
    }
  },
};
