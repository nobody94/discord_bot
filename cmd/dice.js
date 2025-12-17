const {
  getBalance,
  addMoney,
  removeMoney,
  currencyIcon,
} = require("../utils/currency");

module.exports = {
  name: "dice",
  description:
    "Đặt cược vào xúc xắc (1-3 là Thấp, 4-6 là Cao). Cú pháp: !dice [cao/thấp] [số tiền]",
  aliases: ["xucxac,xx"],

  async execute(message, args) {
    const userId = message.author.id;

    // 1. Kiểm tra tham số đầu vào
    if (args.length < 2) {
      return message.reply(
        "❌ | Vui lòng nhập đúng cú pháp: `!dice [cao/thấp] [số tiền cược]`"
      );
    }

    const choice = args[0].toLowerCase(); // cao hoặc thấp
    let betAmount = parseInt(args[1]);

    if (choice !== "cao" && choice !== "thấp") {
      return message.reply("❌ | Lựa chọn phải là **cao** hoặc **thấp**.");
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply("❌ | Số tiền cược phải là một số nguyên dương.");
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

    const roll = Math.floor(Math.random() * 6) + 1; // Tung xúc xắc (1 đến 6)
    const result = roll >= 4 ? "cao" : "thấp";

    // 4. Xác định kết quả và tính toán tiền thưởng
    let resultMessage = `🎲 **KẾT QUẢ XÚC XẮC** 🎲\nĐã tung ra: **${roll}** (${result.toUpperCase()})\n`;

    if (choice === result) {
      // THẮNG
      const winAmount = betAmount * 2; // Thắng gấp đôi tiền cược (lấy lại vốn + tiền lời = 2 * cược)
      await addMoney(userId, winAmount);

      resultMessage += `🎉 **THẮNG!** Bạn đã thắng **${betAmount}** ${currencyIcon}.`;
    } else {
      // THUA
      resultMessage += `😔 **THUA!** Bạn đã mất **${betAmount}** ${currencyIcon}.`;
    }

    message.reply(resultMessage);
  },
};
