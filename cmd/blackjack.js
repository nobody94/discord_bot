const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const Money = require("../utils/currency");
const { getIcon } = require("../utils/currency");
const { errorIcon, verifyIcon } = require("../utils/icon");
const { maxAmount } = require("../utils/constant");
const { renderKey, getKey, setKey } = require("../utils/db");

// Hàm hỗ trợ tính điểm bài
function calculatePoints(hand) {
  let total = 0;
  let aces = 0;

  for (let card of hand) {
    if (card === 11) {
      aces += 1;
      total += 11;
    } else {
      total += card;
    }
  }

  // Nếu bị quá 21, biến Ace thành 1 (trừ đi 10)
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

// Hàm rút lá bài ngẫu nhiên
function drawCard() {
  const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10,10, 11];
  return cards[Math.floor(Math.random() * cards.length)];
}

function drawInitialHand() {
  let card1 = drawCard();
  let card2 = drawCard();

  // Logic giảm tỉ lệ bài > 19
  if (calculatePoints([card1, card2]) > 19 && Math.random() < 0.7) {
    const lowCards = [2, 3, 4, 5, 6, 7, 8];
    card2 = lowCards[Math.floor(Math.random() * lowCards.length)];
  }
  return [card1, card2];
}

const activePlayers = new Set();

module.exports = {
  name: "blackjack",
  aliases: ["bj"],
  description: "Chơi Blackjack với bot dùng nút bấm",

  async execute(message, args) {
    const userId = message.author.id;

    if (activePlayers.has(userId)) {
      return message.reply(
        `${errorIcon} Bạn đang có một hành động chưa kết thúc! Hãy hoàn thành nó trước.`
      );
    }

    const betAmount = parseInt(args[0]);

    // 1. Kiểm tra tiền cược
    if (
      !betAmount ||
      isNaN(betAmount) ||
      betAmount < 100 ||
      betAmount > maxAmount
    ) {
      return message.reply(
        `${errorIcon} Vui lòng cược từ 100 đến ${maxAmount} ${getIcon()}.`,
      );
    }

    const userMoney = await Money.getBalance(userId);
    if (userMoney < betAmount) {
      return message.reply(`${errorIcon} Bạn không đủ tiền để cược.`);
    }

    // 2. Trừ tiền và khởi tạo ván bài
    await Money.removeMoney(userId, betAmount);
    activePlayers.add(userId);

    let playerHand = drawInitialHand();
    let botHand = drawInitialHand();

    // 3. Tạo hàng nút bấm
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Rút bài")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Dừng")
        .setStyle(ButtonStyle.Danger),
    );

    const embedContent = () => `
🃏 **Ván bài Blackjack** (Cược: ${betAmount} ${getIcon()})
- **Bạn:** ${playerHand.join(", ")} (Tổng: ${calculatePoints(playerHand)})
- **Bot:** ${botHand[0]}, ?
        `;

    const response = await message.reply({
      content: embedContent(),
      components: [row],
    });

    // 4. XỬ LÝ SỰ KIỆN NÚT BẤM TẠI ĐÂY
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000, // Hết hạn sau 30 giây
    });

    collector.on("collect", async (interaction) => {
      // Chỉ người gọi lệnh mới được bấm nút
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "Đây không phải ván bài của bạn!",
          ephemeral: true,
        });
      }

      if (interaction.customId === "hit") {
        playerHand.push(drawCard());
        const points = calculatePoints(playerHand);

        if (points > 21) {
          collector.stop("bust");
        } else {
          await interaction.update({ content: embedContent() });
        }
      } else if (interaction.customId === "stand") {
        collector.stop("stand");
        await interaction.deferUpdate(); // Thông báo đã nhận lệnh
      }
    });

    collector.on("end", async (collected, reason) => {
      let finalPoints = calculatePoints(playerHand);
      let botPoints = calculatePoints(botHand);

      // Logic Bot rút bài nếu người chơi Stand (Bot rút đến khi >= 17)
      if (reason === "stand") {
        while (botPoints < 17) {
          botHand.push(drawCard());
          botPoints = calculatePoints(botHand);
        }
      }

      let result = "";
      if (reason === "bust" || finalPoints > 21) {
        result = `❌ **BẠN ĐÃ QUẮC!** (${finalPoints} điểm). Bạn mất ${betAmount} ${getIcon()}.`;
      } else if (botPoints > 21 || finalPoints > botPoints) {
        const winAmount = betAmount * 2;
        await Money.addMoney(userId, winAmount);
        result = `🎉 **BẠN THẮNG!** Bot: ${botPoints}. Bạn nhận được ${winAmount} ${getIcon()}.`;
      } else if (finalPoints < botPoints) {
        result = `😔 **BẠN THUA!** Bot: ${botPoints}. Bạn mất ${betAmount} ${getIcon()}.`;
      } else {
        await Money.addMoney(userId, betAmount); // Hoàn tiền
        result = `🤝 **HÒA!** Cả hai đều có ${finalPoints} điểm. Bạn được hoàn tiền.`;
      }

      activePlayers.delete(userId);

      // Cập nhật tin nhắn cuối cùng (Xóa nút bấm)
      await response.edit({
        content: `
**KẾT QUẢ BLACKJACK**
- **Bạn:** ${playerHand.join(", ")} (${finalPoints} điểm)
- **Bot:** ${botHand.join(", ")} (${botPoints} điểm)
---------------------------
${result}`,
        components: [],
      });
    });
  },
};
