const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const {
  getBalance,
  addMoney,
  removeMoney,
  currencyIcon,
} = require("../utils/currency");

module.exports = {
  name: "dice",
  description: "Đặt cược vào xúc xắc (1-3 là Thấp, 4-6 là Cao)",
  aliases: ["xucxac", "xx"],

  async execute(message) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("dice_thap")
        .setLabel("THẤP (1-3)")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("dice_cao")
        .setLabel("CAO (4-6)")
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({
      content: "🎲 **TRÒ CHƠI XÚC XẮC** 🎲\nHãy chọn **Cao** hoặc **Thấp** bên dưới để đặt cược:",
      components: [row],
    });
  },

  async handleInteraction(interaction) {
    // Xử lý khi nhấn Nút
    if (interaction.isButton()) {
      const choice = interaction.customId.split("_")[1]; // 'cao' hoặc 'thap'
      const modal = new ModalBuilder()
        .setCustomId(`modal_dice_${choice}`)
        .setTitle(`Đặt cược: ${choice === 'cao' ? 'CAO' : 'THẤP'}`);

      const betInput = new TextInputBuilder()
        .setCustomId("bet_amount")
        .setLabel("Nhập số tiền bạn muốn cược:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(betInput));
      await interaction.showModal(modal);
    }

    // Xử lý khi gửi Modal
    if (interaction.isModalSubmit()) {
      const userId = interaction.user.id;
      const choice = interaction.customId.split("_")[2]; // 'cao' hoặc 'thap'
      const betAmount = parseInt(interaction.fields.getTextInputValue("bet_amount"));

      if (isNaN(betAmount) || betAmount <= 0) {
        return interaction.reply({ content: "❌ | Số tiền cược không hợp lệ!", ephemeral: true });
      }

      const currentBalance = await getBalance(userId);
      if (betAmount > currentBalance) {
        return interaction.reply({
          content: `💸 | Bạn không đủ **${betAmount}** ${currencyIcon}. Dư: **${currentBalance}**`,
          ephemeral: true,
        });
      }

      await removeMoney(userId, betAmount);
      const roll = Math.floor(Math.random() * 6) + 1;
      const result = roll >= 4 ? "cao" : "thap";

      let resultMessage = `🎲 **KẾT QUẢ XÚC XẮC** 🎲\nNgười chơi: <@${userId}>\nLựa chọn: **${choice.toUpperCase()}**\nKết quả: **${roll}** (${result.toUpperCase()})\n`;

      if (choice === result) {
        await addMoney(userId, betAmount * 2);
        resultMessage += `🎉 **THẮNG!** Bạn nhận được **${betAmount}** ${currencyIcon}.`;
      } else {
        resultMessage += `😔 **THUA!** Bạn đã mất **${betAmount}** ${currencyIcon}.`;
      }

      await interaction.reply(resultMessage);
    }
  },
};