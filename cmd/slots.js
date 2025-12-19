const {
  getBalance,
  addMoney,
  removeMoney,
  getIcon,
} = require("../utils/currency");

const symbols = [
  "<:cherries:1450752576256475156>",
  "<:watermelon:1450752616349962250>",
  "<:lemon:1450752606887477321>",
  "<:slotmachine:1450752596116635730>",
];

// Tạo một Map để lưu trữ thời gian cooldown
const cooldowns = new Map();
const maxAmount = 50000;

const payouts = {
  "<:slotmachine:1450752596116635730><:slotmachine:1450752596116635730><:slotmachine:1450752596116635730>": 5,
  "<:cherries:1450752576256475156><:cherries:1450752576256475156><:cherries:1450752576256475156>": 3,
  "<:watermelon:1450752616349962250><:watermelon:1450752616349962250><:watermelon:1450752616349962250>": 3,
  "<:lemon:1450752606887477321><:lemon:1450752606887477321><:lemon:1450752606887477321>": 3,
};

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

    // --- KIỂM TRA COOLDOWN (10 GIÂY) ---
    const now = Date.now();
    const cooldownAmount = 10 * 1000; // 10 giây đổi ra miligiây

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        // Gửi tin nhắn cảnh báo ban đầu
        const msg = await message.reply(
          `⏳ | Bạn đang thao tác quá nhanh! Vui lòng chờ **${timeLeft}s** để tiếp tục quay.`
        );

        // Tạo bộ đếm ngược để cập nhật tin nhắn
        const interval = setInterval(async () => {
          const currentNow = Date.now();
          const currentLeft = ((expirationTime - currentNow) / 1000).toFixed(1);

          if (currentLeft <= 0) {
            clearInterval(interval);
            try {
              await msg.delete(); // Xóa tin nhắn khi hết thời gian
            } catch (err) {
              console.log(
                "Không thể xóa tin nhắn (có thể người dùng đã xóa trước)."
              );
            }
          } else {
            try {
              await msg.edit(
                `⏳ | Bạn đang thao tác quá nhanh! Vui lòng chờ **${currentLeft}s** để tiếp tục quay.`
              );
            } catch (err) {
              clearInterval(interval); // Dừng cập nhật nếu tin nhắn bị xóa thủ công
            }
          }
        }, 1000); // Cập nhật mỗi 1 giây

        return;
      }
    }

    let betAmount = parseInt(args[0]);

    // 1. Kiểm tra định dạng số tiền
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply(
        "❌ | Vui lòng nhập đúng cú pháp: `.slots [số tiền cược]`"
      );
    }

    // 2. Chặn cược trên maxAmount
    if (betAmount > maxAmount) {
      return message.reply(
        `❌ | Giới hạn cược tối đa là **${maxAmount}**` + getIcon()
      );
    }

    // 3. Kiểm tra số dư tài khoản
    const currentBalance = await getBalance(userId);
    if (betAmount > currentBalance) {
      return message.reply(
        `💸 | Bạn không đủ tiền. Số dư hiện tại: **${currentBalance}** ${getIcon()}.`
      );
    }

    // Thiết lập thời gian thực hiện lệnh cuối cùng cho người dùng
    cooldowns.set(userId, now);

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
      resultMessage += `\n${winType} (${multiplier}x) Bạn nhận được **${winAmount}** ${getIcon()}.`;
    } else {
      resultMessage += `\n**THUA!** Bạn đã mất **${betAmount}** ${getIcon()}.`;
    }

    await spinningMsg.edit(resultMessage);

    // Tùy chọn: Xóa cooldown sau khi hết hạn để tránh Map bị đầy (nhưng không bắt buộc vì logic trên đã ghi đè)
    setTimeout(() => cooldowns.delete(userId), cooldownAmount);
  },
};
