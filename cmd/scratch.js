const Money = require("../utils/currency");
const { getIcon } = require("../utils/currency");
const { errorIcon, verifyIcon } = require("../utils/icon");
const { maxAmount } = require("../utils/constant");

module.exports = {
  name: "caoveso",
  aliases: ["scratch", "sc"],
  description: "Thử vận may với vé số cào",

  async execute(message, args) {
    const userId = message.author.id;

    // 1. Lấy số tiền cược từ tham số người dùng nhập (ví dụ: .caoveso 500)
    let betAmount = parseInt(args[0]);

    // 2. Kiểm tra tính hợp lệ của số tiền nhập vào
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return message.reply(
        `${errorIcon} Vui lòng nhập số tiền cược hợp lệ. VD: \`.caoveso 500\``
      );
    }

    if (betAmount < 100) {
      return message.reply(
        `${errorIcon} Số tiền cược tối thiểu là **100** ${getIcon()}.`
      );
    }

    if (betAmount > maxAmount) {
      return message.reply(
        `${errorIcon} Số tiền cược tối đa là **${maxAmount}** ${getIcon()}.`
      );
    }

    const userMoney = await Money.getBalance(userId);

    // 3. Kiểm tra số dư tài khoản
    if (userMoney < betAmount) {
      return message.reply(
        `${errorIcon} Bạn không đủ tiền. Số dư hiện tại: **${userMoney}** ${getIcon()}.`
      );
    }

    // 4. Trừ tiền cược
    await Money.addMoney(userId, -betAmount);

    // 5. Logic tính toán phần thưởng (Tỉ lệ nhân dựa trên số tiền cược)
    const winRate = Math.random();
    let reward = 0;
    let resultMessage = "";

    if (winRate < 0.05) {
      // 5% trúng giải Độc Đắc (x10 lần cược)
      reward = betAmount * 5;
      resultMessage = `🎰 **GIẢI ĐỘC ĐẮC!** Bạn đã trúng x5: **${reward}** ${getIcon()}!`;
    } else if (winRate < 0.15) {
      // 10% trúng giải Nhì (x5 lần cược)
      reward = betAmount * 3;
      resultMessage = `🎉 **Giải Nhì!** Bạn đã trúng x3: **${reward}** ${getIcon()}!`;
    } else if (winRate < 0.35) {
      // 20% trúng giải Ba (x2 lần cược)
      reward = betAmount * 2;
      resultMessage = `✨ **Giải Ba!** Bạn nhận được x2: **${reward}** ${getIcon()}.`;
    } else {
      resultMessage = `💥 Chúc bạn may mắn lần sau.`;
    }

    // 6. Cộng tiền nếu trúng
    if (reward > 0) {
      await Money.addMoney(userId, reward);
    }

    // PHẦN HIỂN THỊ THỜI GIAN ĐẾM NGƯỢC
    let timeLeft = 3; // Thời gian cào là 3 giây
    const msg = await message.reply(
      `🎫 Đang cào vé (**${timeLeft}s**)... ▒▒▒▒▒▒▒▒▒▒`
    );

    const countdown = setInterval(async () => {
      timeLeft--;
      if (timeLeft > 0) {
        await msg
          .edit(
            `🎫 Đang cào vé (**${timeLeft}s**)... ${"█".repeat(
              3 - timeLeft
            )}${"▒".repeat(timeLeft + 7)}`
          )
          .catch(() => {});
      } else {
        clearInterval(countdown);
        if (resultMessage) {
          await msg.edit(resultMessage).catch(() => {});
        }
      }
    }, 1000);
  },
};
