const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Money = require("../utils/currency");

module.exports = {
  name: "anxin",
  description: "Gửi lời kêu gọi trợ cấp từ người hảo tâm",

  async execute(message) {
    const requester = message.author;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        // Lưu ID người xin vào CustomID để tí nữa biết cộng tiền cho ai
        .setCustomId(`open_give_modal_${requester.id}`)
        .setLabel(`Tặng tiền cho ${requester.displayName}`)
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({
      content: `🙏 **${requester.displayName}** đang gặp khó khăn và cần sự giúp đỡ từ các đại gia!`,
      components: [row],
    });
  },
  async handleInteraction(interaction) {
    if (
      interaction.isButton() 
    ) {
      const requesterId = interaction.customId.split("_")[3];

      // Không cho phép tự cho tiền chính mình
      if (interaction.user.id === requesterId) {
        return interaction.reply({
          content: "❌ Bạn không thể tự tặng tiền cho bản thân!",
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`confirm_give_modal_${requesterId}`)
        .setTitle("Nhập số tiền muốn tặng");

      const amountInput = new TextInputBuilder()
        .setCustomId("give_amount")
        .setLabel("Số tiền muốn cho:")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: 500")
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
      await interaction.showModal(modal);
    }

    // 2. Khi người hảo tâm gửi Modal (nhập xong số tiền)
    if (
      interaction.isModalSubmit()
    ) {
      const requesterId = interaction.customId.split("_")[3];
      const giverId = interaction.user.id;
      const amount = parseInt(
        interaction.fields.getTextInputValue("give_amount")
      );

      // Kiểm tra tính hợp lệ của số tiền
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "❌ Số tiền không hợp lệ!",
          ephemeral: true,
        });
      }

      // Kiểm tra số dư người cho
      const giverBalance = await Money.getBalance(giverId);
      if (giverBalance < amount) {
        return interaction.reply({
          content: `❌ Bạn không đủ tiền! Số dư hiện tại: ${giverBalance} ${Money.getIcon()}`,
          ephemeral: true,
        });
      }

      try {
        // Thực hiện chuyển tiền
        await Money.addMoney(giverId, -amount);
        await Money.addMoney(requesterId, amount);

        await interaction.reply({
          content: `✅ **${
            interaction.user.displayName
          }** đã tặng **${amount}** ${Money.getIcon()} cho <@${requesterId}>!`,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "❌ Lỗi hệ thống khi chuyển tiền.",
          ephemeral: true,
        });
      }
    }
  },
};
