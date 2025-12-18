const {
  getBalance,
  addMoney,
  removeMoney,
  getIcon
} = require("../utils/currency");

const symbols = ["<:cherries:1450752576256475156>", "<:watermelon:1450752616349962250>", "<:lemon:1450752606887477321>", "<:slotmachine:1450752596116635730>"];

const payouts = {
  "<:slotmachine:1450752596116635730><:slotmachine:1450752596116635730><:slotmachine:1450752596116635730>": 3,
  "<:cherries:1450752576256475156><:cherries:1450752576256475156><:cherries:1450752576256475156>": 2,
  "<:watermelon:1450752616349962250><:watermelon:1450752616349962250><:watermelon:1450752616349962250>": 2,
  "<:lemon:1450752606887477321><:lemon:1450752606887477321><:lemon:1450752606887477321>": 2,
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

module.exports = {
  name: "slots",
  description: "TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN (Thưởng cả khi có 2 hình giống nhau).",
  aliases: ["slot", "sl"],

  async execute(message, args) {
    const userId = message.author.id;
    let betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply("❌ | Vui lòng nhập đúng cú pháp: `.slots [số tiền cược]`");
    }

    if (betAmount > 10000) {
      return message.reply("❌ | Số tiền cược quá nhiều`");
    }

    if (0 < betAmount <= 10000) {
      const currentBalance = await getBalance(userId);
      if (betAmount > currentBalance) {
        return message.reply(`💸 | Bạn không đủ tiền. Số dư: **${currentBalance}** ${getIcon()}.`);
      }

      await removeMoney(userId, betAmount);

      const spinningMsg = await message.reply(`🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ 🔄 | 🔄 | 🔄 ]\n*Đang quay...*`);

      // Hiệu ứng quay
      for (let i = 0; i < 5; i++) {
        await sleep(100);
        await spinningMsg.edit(`🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ ${getRandomSymbol()} | ${getRandomSymbol()} | ${getRandomSymbol()} ]\n*Đang quay...*`);
      }

      // Kết quả cuối cùng
      const roll1 = getRandomSymbol();
      const roll2 = getRandomSymbol();
      const roll3 = getRandomSymbol();
      const resultString = roll1 + roll2 + roll3;

      let multiplier = 0;
      let winType = "";

      // 1. Kiểm tra 3 hình giống nhau (Jackpot)
      if (payouts[resultString]) {
        multiplier = payouts[resultString];
        winType = "JACKPOT! 🎉";
      }
      // 2. Kiểm tra 2 hình giống nhau (Cặp)
      else if (roll1 === roll2 || roll1 === roll3 || roll2 === roll3) {
        multiplier = 1.5; // Thưởng x2 tiền cược nếu có 2 hình giống nhau
        winType = "TRÚNG CẶP! ✨";
      }

      let resultMessage = `🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ ${roll1} | ${roll2} | ${roll3} ]\n`;

      if (multiplier >= 1) {
        const winAmount = betAmount * multiplier;
        await addMoney(userId, winAmount);
        resultMessage += `\n${winType} (${multiplier}x) Bạn nhận được **${winAmount}** ${getIcon()}.`;
      } else {
        resultMessage += `\n**THUA!** Bạn đã mất **${betAmount}** ${getIcon()}.`;
      }

      await spinningMsg.edit(resultMessage);
    }
  },
};