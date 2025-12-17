const {
  getBalance,
  addMoney,
  removeMoney,
  currencyIcon  
} = require("../utils/currency");

// Các biểu tượng và tỷ lệ thanh toán
const symbols = ["🍒", "🔔", "🍋", "7️⃣"]; // Biểu tượng: Cherry, Chuông, Chanh, Bảy may mắn

// Tỷ lệ thanh toán (Payout multipliers)
const payouts = {
  "7️⃣7️⃣7️⃣": 10, // 3 số 7: x10 lần cược
  "🍒🍒🍒": 5, // 3 Cherries: x5 lần cược
  "🔔🔔🔔": 3, // 3 Chuông: x3 lần cược
  "🍋🍋🍋": 2, // 3 Chanh: x2 lần cược
};

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

module.exports = {
  name: "slots",
  description: "Chơi máy đánh bạc (3 hàng ngang). Cú pháp: .slots [số tiền]",
  aliases: ["slot",'sl'],

  async execute(message, args) {
    const userId = message.author.id;

    // 1. Kiểm tra tham số đầu vào
    let betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply(
        "❌ | Vui lòng nhập đúng cú pháp: `!slots [số tiền cược]` (Phải là số nguyên dương)."
      );
    }

    // 2. Kiểm tra số dư
    const currentBalance = await getBalance(userId);
    if (betAmount > currentBalance) {
      return message.reply(
        `💸 | Bạn không có đủ **${betAmount}** ${currencyIcon}. Số dư hiện tại: **${currentBalance}** ${currencyIcon}.`
      );
    }

    // 3. Thực hiện cược
    await removeMoney(userId, betAmount); // Trừ tiền cược trước

    // Quay ba cuộn
    const roll1 = getRandomSymbol();
    const roll2 = getRandomSymbol();
    const roll3 = getRandomSymbol();

    const resultString = roll1 + roll2 + roll3;

    let multiplier = 0;
    let resultMessage = `🎰 **MÁY ĐÁNH BẠC** 🎰\n[ ${roll1} | ${roll2} | ${roll3} ]\n`;

    // 4. Kiểm tra kết quả
    if (payouts[resultString]) {
      multiplier = payouts[resultString];
    } else if (roll1 === roll2 && roll2 === roll3) {
      // Trường hợp 3 biểu tượng không có trong danh sách payouts (chưa định nghĩa)
      multiplier = 1;
    }

    // 5. Tính toán và thông báo
    if (multiplier > 1) {
      // THẮNG LỚN (Thắng lớn hơn vốn)
      const winAmount = betAmount * multiplier;
      const profit = winAmount - betAmount;
      await addMoney(userId, winAmount);

      resultMessage += `\n🎉 **JACKPOT!** (${multiplier}x) Bạn thắng **${winAmount}** ${currencyIcon}. Tiền lời: **+${profit}** ${currencyIcon}.`;
    } else if (multiplier === 1) {
      // HÒA VỐN (Ví dụ: Ba biểu tượng giống nhau nhưng tỷ lệ 1x)
      await addMoney(userId, betAmount); // Hoàn lại tiền cược
      resultMessage += `\n👌 **HÒA VỐN!** Bạn lấy lại **${betAmount}** ${currencyIcon}.`;
    } else {
      // THUA
      resultMessage += `\n😔 **THUA!** Chúc bạn may mắn lần sau. Bạn đã mất **${betAmount}** ${currencyIcon}.`;
    }

    message.reply(resultMessage);
  },
};
