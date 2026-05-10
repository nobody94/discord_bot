const {
  getBalance,
  addMoney,
  removeMoney,
  getIcon,
} = require("../utils/currency");
const {maxAmount} = require('../utils/constant');
const { errorIcon,slotsIcon } = require('../utils/icon.js')
const { checkCooldown,getCountdown } = require('../utils/cooldown');

const symbols = slotsIcon;

const payouts = Object.fromEntries(symbols.map(x => [`${x}${x}${x}`, 3]));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

module.exports = {
  name: "slots",
  description:
    "TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN (Thưởng cả khi có 2 hình giống nhau).",
  aliases: ["slot", "sl"],

  async execute(message, args) {
    const userId = message.author.id;    

    if (checkCooldown(userId,'slot',10)) {
      return  msg = await message.reply(
          `⏳ | Bạn đang thao tác quá nhanh! Vui lòng chờ **${getCountdown(userId,'slot',10)}s** để tiếp tục quay.`
        );
    }

    let betAmount = parseInt(args[0]);

    // 1. Kiểm tra định dạng số tiền
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply(
        `${errorIcon} | Vui lòng nhập đúng cú pháp: .slots [số tiền cược]`
      );
    }

    // 2. Chặn cược trên maxAmount
    if (betAmount > maxAmount) {
      return message.reply(
        `${errorIcon} | Giới hạn cược tối đa là **${maxAmount}**` + getIcon()
      );
    }

    // 3. Kiểm tra số dư tài khoản
    const currentBalance = await getBalance(userId);
    if (betAmount > currentBalance) {
      return message.reply(
        `💸 | Bạn không đủ tiền. Số dư hiện tại: **${currentBalance}** ${getIcon()}.`
      );
    }

       // --- BẮT ĐẦU XỬ LÝ GAME ---
    await removeMoney(userId, betAmount);

    const spinningMsg = await message.reply(
      `🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ 🔄 | 🔄 | 🔄 ]\n*Đang quay...*`
    );

    // Hiệu ứng quay
    for (let i = 0; i < 5; i++) {
      await sleep(100);
      await spinningMsg.edit(
        `🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ ${getRandomSymbol()} | ${getRandomSymbol()} | ${getRandomSymbol()} ]\n*Đang quay...*`
      );
    }

    const roll1 = getRandomSymbol();
    const roll2 = getRandomSymbol();
    const roll3 = getRandomSymbol();
    const resultString = roll1 + roll2 + roll3;

    let multiplier = 0;
    let winType = "";

    if (payouts[resultString]) {
      multiplier = payouts[resultString];
      winType = "JACKPOT! 🎉";
    } else if (roll1 === roll2 || roll1 === roll3 || roll2 === roll3) {
      multiplier = 2;
      winType = "TRÚNG CẶP! ✨";
    }

    let resultMessage = `🎰 **TÍCH CỰC GACHA VẬN MAY SẼ ĐẾN** 🎰\n[ ${roll1} | ${roll2} | ${roll3} ]\n`;

    if (multiplier >= 1) {
      const winAmount = Math.floor(betAmount * multiplier);
      await addMoney(userId, winAmount);
      resultMessage += winAmount == betAmount ? `\n${winType} - Hòa vốn - Bạn được nhận lại **${winAmount}** ${getIcon()}.` : `\n${winType} (${multiplier}x) Bạn nhận được **${winAmount}** ${getIcon()}.`;
    } else {
      resultMessage += `\n**THUA!** Bạn đã mất **${betAmount}** ${getIcon()}.`;
    }

    await spinningMsg.edit(resultMessage);
  },
};
