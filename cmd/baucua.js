const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { baucuaIcon, verifyIcon, errorIcon } = require("../utils/icon");
const Money = require("../utils/currency");
const { maxAmount } = require("../utils/constant");

const baucuaLabel = {
  bau: { icon: baucuaIcon.bau, label: "bầu" },
  cua: { icon: baucuaIcon.cua, label: "cua" },
  tom: { icon: baucuaIcon.tom, label: "tôm" },
  ca: { icon: baucuaIcon.ca, label: "cá" },
  ga: { icon: baucuaIcon.ga, label: "gà" },
  nai: { icon: baucuaIcon.nai, label: "nai" },
};

// Lưu trữ các phiên cược đang diễn ra
const activeGames = new Map();

function quayBauCua() {
  const keys = Object.keys(baucuaIcon);
  return [
    keys[Math.floor(Math.random() * keys.length)],
    keys[Math.floor(Math.random() * keys.length)],
    keys[Math.floor(Math.random() * keys.length)],
  ];
}

module.exports = {
  name: "baucua",
  aliases: ["bc"],
  async execute(message) {
    const guildId = message.guild.id;
    const gameTitle = `🎲 **BẦU CUA TÔM CÁ** 🎲`;

    if (activeGames.has(guildId)) {
      return message.reply(
        "Một phiên cược đang diễn ra, hãy đặt cược ở bảng trên!"
      );
    }

    const duration = 30000; // 30 giây
    const endTime = Date.now() + duration;
    const discordTimestamp = Math.floor(endTime / 1000);

    activeGames.set(guildId, {
      players: [],
      endTime: endTime,
    });

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

    const mainMsg = await message.channel.send({
      content: `${gameTitle}\n⏳ Kết thúc cược: <t:${discordTimestamp}:R>\n(Tối đa ${maxAmount.toLocaleString()} Mora/lượt)`,
      components: [row1, row2],
    });

    // Đợi hết 30 giây cược
    setTimeout(async () => {
      const gameData = activeGames.get(guildId);
      if (!gameData) return;
      activeGames.delete(guildId);

      // 1. XÓA NÚT BẤM KHI HẾT GIỜ
      await mainMsg.edit({
        content: `${gameTitle}\n⌛ **Đã hết thời gian đặt cược!**`,
        components: [],
      });

      // 2. PHẦN XỬ LÝ QUAY (HIỆU ỨNG)
      const animationFrames = 3;
      for (let i = 0; i < animationFrames; i++) {
        const randomFrame = [
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)],
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)],
          Object.values(baucuaIcon)[Math.floor(Math.random() * 6)],
        ];
        await mainMsg.edit({
          content: `${gameTitle}\n Đang lắc... **[ ${randomFrame.join(
            " | "
          )} ]** `,
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 3. KẾT QUẢ CUỐI CÙNG
      const results = quayBauCua();
      const icons = results.map((r) => baucuaIcon[r]);

      let resultSummary = `${gameTitle}\n Kết quả: **${icons.join(
        " | "
      )}** \n\n`;
      let winnersText = "";

      if (gameData.players.length === 0) {
        resultSummary += "Không có ai tham gia phiên này.";
      } else {
        for (const player of gameData.players) {
          const matchCount = results.filter((r) => r === player.choice).length;
          if (matchCount > 0) {
            const winAmount = player.amount + matchCount * player.amount;
            await Money.addMoney(player.userId, winAmount);
            winnersText += `${verifyIcon} **${
              player.userName
            }** thắng **${winAmount.toLocaleString()}** ${Money.getIcon()} (${
              baucuaLabel[player.choice].label
            })\n`;
          } else {
            winnersText += `${errorIcon} **${
              player.userName
            }** thua **${player.amount.toLocaleString()}** ${Money.getIcon()} (${
              baucuaLabel[player.choice].label
            })\n`;
          }
        }
      }

      await mainMsg.edit({ content: resultSummary + (winnersText || "") });
    }, duration);
  },
  async handleInteraction(interaction) {
    const guildId = interaction.guild.id;

    if (interaction.isButton()) {
      if (!activeGames.has(guildId)) {
        return interaction.reply({
          content: "Phiên cược này đã kết thúc!",
          ephemeral: true,
        });
      }
      const animal = interaction.customId.split("_")[1];
      const modal = new ModalBuilder()
        .setCustomId(`modal_bc_${animal}`)
        .setTitle(`Đặt cược: ${baucuaLabel[animal].label.toUpperCase()}`);

      const moneyInput = new TextInputBuilder()
        .setCustomId("bet_amount")
        .setLabel(`Nhập số Mora cược (Tối đa ${maxAmount}):`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const gameData = activeGames.get(guildId);
      if (!gameData)
        return interaction.reply({
          content: "Hết thời gian đặt cược!",
          ephemeral: true,
        });

      const animalChoice = interaction.customId.split("_")[2];
      const betAmount = parseInt(
        interaction.fields.getTextInputValue("bet_amount")
      );
      const userId = interaction.user.id;

      if (isNaN(betAmount) || betAmount <= 0 || betAmount > 10000) {
        return interaction.reply({
          content: `Tiền cược không hợp lệ (1 - ${maxAmount})!`,
          ephemeral: true,
        });
      }

      const balance = await Money.getBalance(userId);
      if (balance < betAmount) {
        return interaction.reply({
          content: "Bạn không đủ tiền!",
          ephemeral: true,
        });
      }

      // Trừ tiền ngay khi đặt cược
      await Money.removeMoney(userId, betAmount);
      gameData.players.push({
        userId,
        userName: interaction.user.username,
        choice: animalChoice,
        amount: betAmount,
      });

      await interaction.reply({
        content: `Bạn đã cược **${betAmount.toLocaleString()}** vào **${
          baucuaLabel[animalChoice].label
        }**!`,
        ephemeral: true,
      });
    }
  },
};
