const { ActionRowBuilder, ButtonBuilder, ButtonStyle,ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");
const { baucuaIcon,errorIcon } = require("../utils/icon");
const Money = require('../utils/currency');
const { maxAmount } = require('../utils/constant');

const baucuaLabel = {
    bau: {
      icon:baucuaIcon.bau,
      label:"bầu"
    },
    cua: {
      icon:baucuaIcon.cua,
      label:'cua'
    },
    tom: {
      icon:baucuaIcon.tom,
      label:'tôm'
    },
    ca: {
      icon:baucuaIcon.ca,
      label:'cá'
    },
    ga: {
      icon:baucuaIcon.ga,
      label:'gà'
    },
    nai: {
      icon:baucuaIcon.nai,
      label:'nai'
    }
};

function quayBauCua() {
    const keys = Object.keys(baucuaIcon);
    // Quay 3 kết quả ngẫu nhiên
    const results = [
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)]
    ];
    return results;
}

module.exports = {
  name: "baucua",
  aliases: ["bc"],
  description: "Chơi bầu cua tôm cá bằng nút bấm",
  async execute(message) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc_bau")
        .setLabel("Bầu")
        .setEmoji(baucuaIcon.bau)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("bc_cua")
        .setLabel("Cua")
        .setEmoji(baucuaIcon.cua)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("bc_tom")
        .setLabel("Tôm")
        .setEmoji(baucuaIcon.tom)
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("bc_ca")
        .setLabel("Cá")
        .setEmoji(baucuaIcon.ca)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("bc_ga")
        .setLabel("Gà")
        .setEmoji(baucuaIcon.ga)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("bc_nai")
        .setLabel("Nai")
        .setEmoji(baucuaIcon.nai)
        .setStyle(ButtonStyle.Primary)
    );

    await message.reply({
      content: "🎲 **BẦU CUA TÔM CÁ** 🎲\nHãy chọn linh vật bạn muốn đặt cược:",
      components: [row1, row2],
    });
  },
  async handleInteraction(interaction) {
    if (interaction.isButton()) {
      const animal = interaction.customId.split("_")[1];
      const modal = new ModalBuilder()
        .setCustomId(`modal_bc_${animal}`)
        .setTitle(`Đặt cược: ${baucuaLabel[animal].label.toUpperCase()}`);

      const moneyInput = new TextInputBuilder()
        .setCustomId("bet_amount")
        .setLabel(`Nhập số tiền Mora muốn cược (Không quá ${maxAmount}):`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: 1000")
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const animalChoice = interaction.customId.split("_")[2];
      const betAmount = parseInt(interaction.fields.getTextInputValue("bet_amount"));
      const userId = interaction.user.id;

      if (isNaN(betAmount) || betAmount <= 0) {
        return interaction.reply({ content: "Số tiền không hợp lệ!", ephemeral: true });
      }

      if (betAmount > maxAmount) {
        return interaction.reply({
          content: `${errorIcon} Mức cược tối đa mỗi lượt là **${maxAmount} ${Money.getIcon}**!`,
          ephemeral: true,
        });
      }

      const balance = await Money.getBalance(userId);
      if (balance < betAmount) {
        return interaction.reply({
          content: `Bạn không đủ Mora! Số dư hiện tại: ${balance.toLocaleString()}`,
          ephemeral: true,
        });
      }

      // --- BẮT ĐẦU HIỆU ỨNG QUAY ---
      await interaction.deferReply(); // Trả lời tạm thời để xử lý logic lâu hơn
      await Money.removeMoney(userId, betAmount);

      const animationFrames = 3; // Số lần đổi icon để tạo hiệu ứng quay
      
      for (let i = 0; i < animationFrames; i++) {
        // Lấy ngẫu nhiên các icon để hiển thị lúc đang quay
        const randomFrame = [
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)],
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)],
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)]
        ];
        
        await interaction.editReply({
          content: `Đang lắc... **[ ${randomFrame.join(" | ")} ]**`
        });
        
        // Đợi 0.8 giây giữa mỗi lần "lắc"
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // --- KẾT QUẢ CUỐI CÙNG ---
      const results = quayBauCua(); //
      const matchCount = results.filter((r) => r === animalChoice).length; //
      const icons = results.map((r) => baucuaIcon[r]); //
      const choiceLabel = baucuaLabel[animalChoice].label; //

      let msg = `Kết quả: **${icons.join(" | ")}**\n\n`; //

      if (matchCount > 0) {
        const winAmount = betAmount + matchCount * betAmount; //
        await Money.addMoney(userId, winAmount); //
        msg += `🎉 Bạn chọn **${choiceLabel}** và trúng **${matchCount}** lần! Nhận được **${winAmount.toLocaleString()}** ${Money.getIcon()}.`; //
      } else {
        msg += `💸 Rất tiếc, không có con **${choiceLabel}** nào. Bạn mất **${betAmount.toLocaleString()}** ${Money.getIcon()}.`; //
      }

      await interaction.editReply({ content: msg });
    }
  },
};
