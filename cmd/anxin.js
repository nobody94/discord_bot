const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const Money = require("../utils/currency");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { checkCooldown } = require('../utils/cooldown');

module.exports = {
  name: "anxin",
  description: "Gửi lời kêu gọi trợ cấp từ người hảo tâm",

  async execute(message) {
    const requester = message.author;

     if (checkCooldown(message.author.id, 'anxin', 60)) {
            return message.reply("⏳ | Bạn đang thao tác quá nhanh! Vui lòng đợi vài giây để tiếp tục xin tiền.")
                .then(msg => setTimeout(() => msg.delete().catch(() => null), 5000));
    }

    // 1. Tạo nút bấm ban đầu
    const button = new ButtonBuilder()
      .setCustomId(`open_give_modal_${requester.id}`)
      .setLabel(`Tặng tiền cho ${requester.displayName}`)
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    // 2. Gửi tin nhắn và lưu lại object tin nhắn để xử lý sau này
    const response = await message.channel.send({
      content: `🙏 **${requester.displayName}** đang gặp khó khăn và cần sự giúp đỡ từ các đại gia! (Nút có hiệu lực trong 2 phút)`,
      components: [row],
    });

    // 3. Thiết lập thời gian chờ 2 phút (120,000ms) để vô hiệu hóa nút
    setTimeout(async () => {
      try {
        // Tạo nút mới ở trạng thái bị vô hiệu hóa (Disabled)
        const disabledButton = ButtonBuilder.from(button).setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(disabledButton);

        // Cập nhật lại tin nhắn để người dùng không bấm được nữa
        await response.edit({
          content: `⌛ **Thông báo:** Lời kêu gọi của **${requester.displayName}** đã hết hạn trợ cấp.`,
          components: [disabledRow],
        });
      } catch (err) {
        console.error("Không thể vô hiệu hóa nút anxin:", err);
      }
    }, 120000); // 120,000ms = 2 phút
  },

  async handleInteraction(interaction) {
    // 1. Xử lý khi nhấn nút mở Modal
    if (interaction.isButton()) {
      const requesterId = interaction.customId.split("_")[3];

      if (interaction.user.id === requesterId) {
        return interaction.reply({
          content: `${errorIcon} Bạn không thể tự tặng tiền cho bản thân!`,
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
    if (interaction.isModalSubmit()) {
      const requesterId = interaction.customId.split("_")[3];
      const giverId = interaction.user.id;
      const amount = parseInt(interaction.fields.getTextInputValue("give_amount"));

      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: `${errorIcon} Số tiền không hợp lệ!`,
          ephemeral: true,
        });
      }

      const giverBalance = await Money.getBalance(giverId);
      if (giverBalance < amount) {
        return interaction.reply({
          content: `${errorIcon} Bạn không đủ tiền! Số dư hiện tại: ${giverBalance} ${Money.getIcon()}`,
          ephemeral: true,
        });
      }

      try {
        await Money.removeMoney(giverId, amount);
        await Money.addMoney(requesterId, amount);

        await interaction.reply({
          content: `${verifyIcon} **${interaction.user.displayName}** đã tặng **${amount}** ${Money.getIcon()} cho <@${requesterId}>!`,
        });
        
        // (Tùy chọn) Xóa nút ngay sau khi có người tặng thành công
        // await interaction.message.edit({ components: [] }).catch(() => {});
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `${errorIcon} Lỗi hệ thống khi chuyển tiền.`,
          ephemeral: true,
        });
      }
    }
  },
};