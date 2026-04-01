const Money = require("../utils/currency");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { getKey, renderKey } = require("../utils/db");

module.exports = {
  name: "give",
  aliases: ["gui"],
  description: "Chuyển tiền cho người dùng khác (Chỉ chấp nhận mora hoặc primo)",

  async execute(message, args) {
    // 1. Kiểm tra tag người nhận
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("⚠️ | Bạn cần tag người muốn tặng tiền! Ví dụ: `.give @user 100 primo`.");
    }

    if (target.id === message.author.id) {
      return message.reply("⚠️ | Bạn không thể tự tặng tiền cho chính mình!");
    }

    if (target.bot) {
      return message.reply("⚠️ | Bạn không thể tặng tiền cho Bot!");
    }

    // 2. Kiểm tra số lượng tiền
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ | Vui lòng nhập số tiền hợp lệ để tặng!");
    }

    // 3. Kiểm tra loại tiền (Chỉ cho phép mora hoặc primo)
    const currencyType = args[2] ? args[2].toLowerCase() : 'mora';
    const allowedCurrencies = ['mora', 'primo'];

    if (!allowedCurrencies.includes(currencyType)) {
      return message.reply(`${errorIcon} | Loại tiền không hợp lệ! Bạn chỉ có thể tặng **mora** hoặc **primo**.`);
    }

    const senderId = message.author.id;
    const receiverId = target.id;

    //kiểm tra nợ
    const loanKey = renderKey("loan", message.guild.id);
    let allLoans = (await getKey(loanKey)) || [];
    const userLoans = allLoans.filter(l => l.nguoi_vay === senderId);

    // Kiểm tra xem có khoản nợ nào quá 3 ngày không
    const hasOverdueDebt = userLoans.some(loan => {
      const loanDate = new Date(loan.date);
      const diffTime = Math.abs(new Date() - loanDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays >= 3;
    });

    if (hasOverdueDebt) {
      return message.reply(`${errorIcon} | **GIAO DỊCH BỊ CHẶN!** Bạn đang có khoản nợ quá hạn (trên 3 ngày). Vui lòng dùng lệnh \`.trano\` để thanh toán trước khi chuyển tiền cho người khác.`);
    }

    try {
      // 4. Kiểm tra số dư của người gửi theo loại tiền đã chọn
      const senderBalance = await Money.getBalance(senderId, currencyType);

      if (senderBalance < amount) {
        return message.reply(
          `${errorIcon} | Bạn không đủ **${currencyType}**! Số dư hiện tại: **${senderBalance.toLocaleString()}** ${Money.getIcon(currencyType)}`
        );
      }

      // 5. Thực hiện chuyển tiền
      await Money.removeMoney(senderId, amount, currencyType);
      await Money.addMoney(receiverId, amount, currencyType);

      return message.channel.send(
        `${verifyIcon} | **${message.author.username}** đã tặng **${amount.toLocaleString()}** ${Money.getIcon(currencyType)} cho **${target.username}**!`
      );

    } catch (error) {
      console.error("Lỗi khi thực hiện lệnh give:", error);
      return message.reply(`${errorIcon} | Đã xảy ra lỗi khi thực hiện giao dịch.`);
    }
  },
};