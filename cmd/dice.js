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
  getIcon,
} = require("../utils/currency");
const {maxAmount} = require('../utils/constant');
const { errorIcon,dicesIcon } = require('../utils/icon.js')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const symbols = dicesIcon;

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

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
      content:
        "🎲 **TRÒ CHƠI XÚC XẮC** 🎲\nHãy chọn **Cao** hoặc **Thấp** bên dưới để đặt cược:",
      components: [row],
    });
  },  
  async handleInteraction(interaction) {
    if (interaction.isButton()) {
      const choice = interaction.customId.split("_")[1];
      const modal = new ModalBuilder()
        .setCustomId(`modal_dice_${choice}`)
        .setTitle(`Đặt cược: ${choice === "cao" ? "CAO" : "THẤP"}`);

      const betInput = new TextInputBuilder()
        .setCustomId("bet_amount")
        .setLabel(`Nhập số tiền bạn muốn cược (Không quá ${maxAmount}):`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(betInput));
      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const userId = interaction.user.id;
      const choice = interaction.customId.split("_")[2];
      const betAmount = parseInt(
        interaction.fields.getTextInputValue("bet_amount")
      );

      if (isNaN(betAmount) || betAmount <= 0) {
        return interaction.reply({
          content: `${errorIcon} | Số tiền cược không hợp lệ!`,
          ephemeral: true,
        });
      }

      const currentBalance = await getBalance(userId);
      if (betAmount > currentBalance) {
        return interaction.reply({
          content: `💸 | Bạn không đủ tiền. Dư: **${currentBalance}** ${getIcon()}`,
          ephemeral: true,
        });
      }

      // --- THÊM ĐIỀU KIỆN GIỚI HẠN ---
      if (betAmount > maxAmount) {
        return interaction.reply({
          content: `${errorIcon} | Số tiền đặt cược tối đa là **${maxAmount}**!`,
          ephemeral: true,
        });
      }

      // 1. Phản hồi interaction ngay lập tức để tránh lỗi "Something went wrong"
      await interaction.reply({
        content: `🎲 Bạn đã cược **${betAmount}** ${getIcon()} vào **${choice.toUpperCase()}**!`,
        ephemeral: true,
      });

      // 2. Trừ tiền
      await removeMoney(userId, betAmount);

      // 3. Sử dụng interaction.channel.send thay vì message.reply
      const spinningMsg = await interaction.channel.send(
        `🎰 **DICE GAME** 🎰\n[ 🔄 ]\n*Đang quay...*`
      );

      for (let i = 0; i < 5; i++) {
        await sleep(200);
        await spinningMsg.edit(
          `🎰 **DICE GAME** 🎰\n[ ${getRandomSymbol()} ]\n*Đang quay...*`
        );
      }

      const roll = Math.floor(Math.random() * 6) + 1;
      const result = roll >= 4 ? "cao" : "thap";
      const resultEmoji = symbols[roll - 1]; // Lấy emoji tương ứng với số nút

      let resultMessage = `🎲 **KẾT QUẢ XÚC XẮC** 🎲\nNgười chơi: <@${userId}>\nLựa chọn: **${choice.toUpperCase()}**\nKết quả: ${resultEmoji} **${roll}** (${result.toUpperCase()})\n`;

      if (choice === result) {
        await addMoney(userId, betAmount * 2);
        resultMessage += `🎉 **THẮNG!** Bạn nhận được **${
          betAmount * 2
        }** ${getIcon()}.`;
      } else {
        resultMessage += `😔 **THUA!** Bạn đã mất **${betAmount}** ${getIcon()}.`;
      }

      await spinningMsg.edit(resultMessage);
    }
  },
};
