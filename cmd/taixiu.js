const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  EmbedBuilder,
} = require("discord.js");
const { maxAmount } = require("../utils/constant");
const { errorIcon, verifyIcon, dicesIcon } = require('../utils/icon.js');

const {
  getBalance,
  addMoney,
  removeMoney,
  getIcon,
} = require("../utils/currency");

// --- CẤU HÌNH VÒNG ĐẤU ---
const BETTING_TIME = 40;
const ROLLING_TIME = 5;

const userBetState = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const currentRound = {
  message: null,
  status: "inactive",
  bets: new Map(),
  endTime: 0,
  confirmationMsgIds: [],
};

// --- CÁC HÀM HỖ TRỢ ---
function rollDice() {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const roll3 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2 + roll3;

  // SỬA LỖI: Trả về kết quả không dấu để so sánh chuẩn với customId
  let result = (roll1 === roll2 && roll2 === roll3) ? "bao" : (total >= 11 ? "tai" : "xiu");
  
  const isEven = total % 2 === 0;
  return {
    rolls: [roll1, roll2, roll3],
    total,
    result,
    isTriple: result === "bao",
    isEven,
  };
}

function getChoiceLabel(choice) {
  return (
    { tai: "Tài", xiu: "Xỉu", chan: "Chẵn", le: "Lẻ" }[choice] ||
    choice.toUpperCase()
  );
}

async function finishRound(message) {
  const components = message.components.map((row) =>
    new ActionRowBuilder().addComponents(
      row.components.map((button) =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    )
  );

  await message
    .edit({
      content: "🛑 **HẾT GIỜ ĐẶT CƯỢC!** 🛑\nĐang tiến hành tung xúc xắc...",
      components: components,
    })
    .catch(console.error);

  if (currentRound.bets.size === 0) {
    currentRound.status = "inactive";
    return message.channel.send(
      "⏱️ | Hết giờ! Không có người chơi nào đặt cược."
    );
  }

  currentRound.status = "rolling";
  if (currentRound.confirmationMsgIds.length > 0) {
    await message.channel
      .bulkDelete(currentRound.confirmationMsgIds, true)
      .catch(() => {});
    currentRound.confirmationMsgIds = [];
  }

  const rollingSymbols = dicesIcon;

  for (let i = 0; i < ROLLING_TIME * 2; i++) {
    const rolling = [
      rollingSymbols[Math.floor(Math.random() * 6)],
      rollingSymbols[Math.floor(Math.random() * 6)],
      rollingSymbols[Math.floor(Math.random() * 6)],
    ];
    await message
      .edit({ content: `🎲 **ĐANG QUAY...**\n[ ${rolling.join(" | ")} ]` })
      .catch(() => {});
    await delay(500);
  }

  const { rolls, total, result, isTriple, isEven } = rollDice();
  
  // Hiển thị kết quả có dấu cho thân thiện
  const displayResult = isTriple ? "BÃO" : (result === "tai" ? "TÀI" : "XỈU");
  
  let resultMessage = `🎲 **KẾT QUẢ:\n${rolls
    .map((d) => rollingSymbols[d - 1])
    .join(" | ")} - TỔNG: ${total}**\n**${displayResult} | ${isEven ? "CHẴN" : "LẺ"}**\n\n`;

  for (const [userId, bet] of currentRound.bets) {
    let win = false;
    if (!isTriple) {
        // So sánh chuỗi không dấu: "tai" === "tai" hoặc "xiu" === "xiu"
      if (bet.choice === result) win = true;
      else if (bet.choice === "chan" && isEven) win = true;
      else if (bet.choice === "le" && !isEven) win = true;
    }

    const choiceName = getChoiceLabel(bet.choice);

    if (win) {
      await addMoney(userId, bet.amount * 2);
      resultMessage += `**${bet.username}**: Cược **${choiceName}** (**${bet.amount.toLocaleString()}**)\n**Lụm ${(bet.amount * 2).toLocaleString()}** ${getIcon()}\n`;
    } else {
     resultMessage += `**${bet.username}**: Cược **${choiceName}** (**${bet.amount.toLocaleString()}**)\n**Toạch ${bet.amount.toLocaleString()}** ${getIcon()}\n`;
    }
  }

  await message
    .edit({ content: resultMessage, components: [] })
    .catch(console.error);
    
  currentRound.status = "inactive";
  currentRound.bets.clear();
}

// --- MODULE EXPORTS ---
module.exports = {
  name: "taixiu",
  aliases: ["tx"],
  description: "Đặt Tài/Xỉu/Chẵn/Lẻ",

  async execute(message) {
    if (currentRound.status !== "inactive")
      return message.reply(`${errorIcon} | Vòng đấu đang diễn ra, vui lòng đợi.`);

    currentRound.status = "betting";
    currentRound.bets.clear();
    currentRound.confirmationMsgIds = [];

    const taiButton = new ButtonBuilder()
      .setCustomId("tx_tai")
      .setLabel("Đặt Tài")
      .setStyle(ButtonStyle.Success);
    const xiuButton = new ButtonBuilder()
      .setCustomId("tx_xiu")
      .setLabel("Đặt Xỉu")
      .setStyle(ButtonStyle.Success);
    const chanButton = new ButtonBuilder()
      .setCustomId("tx_chan")
      .setLabel("Đặt Chẵn")
      .setStyle(ButtonStyle.Danger);
    const leButton = new ButtonBuilder()
      .setCustomId("tx_le")
      .setLabel("Đặt Lẻ")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(taiButton, xiuButton);
    const row2 = new ActionRowBuilder().addComponents(chanButton, leButton);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🎲 **Tài Xỉu Teyvat**")
      .setDescription(
        `Chọn Tài/ Xỉu , Chẵn/Lẻ để đặt cược.\nSau khi chọn, nhập số **MORA** bạn muốn cược\n\n` +
        `• **Xỉu**: 4-10 điểm | **Tài**: 11-17 điểm\n` +
        `• **Bão**: 3 mặt giống nhau (Nhà cái ăn hết)\n` +
        `• Cược tối đa: **${maxAmount.toLocaleString()}** Mora`
      );

    await message.channel.send({ embeds: [embed] });
    const gameMessage = await message.channel.send({
      content: `⏱️ CÒN **${BETTING_TIME}** GIÂY ĐẶT CƯỢC`,
      components: [row1, row2],
    });
    currentRound.message = gameMessage;

    let timeLeft = BETTING_TIME;
    while (timeLeft > 0 && currentRound.status === "betting") {
      await delay(1000);
      timeLeft--;
      if (timeLeft % 10 === 0 || timeLeft <= 5)
        await gameMessage
          .edit({ content: `⏱️ CÒN **${timeLeft}** GIÂY ĐẶT CƯỢC` })
          .catch(() => {});
    }
    if (currentRound.status === "betting") await finishRound(gameMessage);
  },

  async handleInteraction(interaction) {
    if (interaction.isButton()) {
      if (currentRound.status !== "betting") {
        return interaction.reply({
          content: `${errorIcon} | Hết thời gian đặt cược!`,
          ephemeral: true,
        });
      }

      const choice = interaction.customId.split("_")[1];
      userBetState.set(interaction.user.id, choice);

      const modal = new ModalBuilder()
        .setCustomId(`modal_tx_${interaction.user.id}`)
        .setTitle(`Đặt cược ${getChoiceLabel(choice)}`);

      const betInput = new TextInputBuilder()
        .setCustomId("betAmountInput")
        .setLabel(`Số tiền cược (Tối đa ${maxAmount.toLocaleString()}):`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ví dụ: 50000")
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(betInput));
      await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.user.id;
      const choice = userBetState.get(userId);
      const betInput = interaction.fields.getTextInputValue("betAmountInput");
      const betAmount = Math.floor(Number(betInput));

      if (currentRound.status !== "betting")
        return interaction.editReply(`${errorIcon} | Hết thời gian cược!`);
      
      if (!choice || isNaN(betAmount) || betAmount <= 0)
        return interaction.editReply(`${errorIcon} | Số tiền cược không hợp lệ.`);
        
      if (betAmount > maxAmount) {
        return interaction.editReply(`${errorIcon} | Bạn không được cược quá **${maxAmount.toLocaleString()}**!`);
      }

      if (currentRound.bets.has(userId))
        return interaction.editReply(`${errorIcon} | Bạn đã đặt cược trong vòng này rồi.`);

      const balance = await getBalance(userId);
      if (betAmount > balance)
        return interaction.editReply(
          `💸 | Bạn không đủ Mora để cược (Hiện có: **${balance.toLocaleString()}** ${getIcon()}).`
        );

      // Trừ tiền và ghi nhận cược
      await removeMoney(userId, betAmount);
      currentRound.bets.set(userId, {
        choice,
        amount: betAmount,
        username: interaction.user.globalName || interaction.user.username,
      });

      await interaction.deleteReply().catch(() => {});
      const confirm = await interaction.followUp({
        content: `${verifyIcon} **${interaction.user.username}** đã cược **${betAmount.toLocaleString()}** ${getIcon()} vào **${getChoiceLabel(choice)}**`,
        ephemeral: false,
      });      
      currentRound.confirmationMsgIds.push(confirm.id);
      userBetState.delete(userId);
    }
  },
};