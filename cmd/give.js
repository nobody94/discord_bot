const Money = require("../utils/currency");

module.exports = {
  name: "give",
  aliases: ["tang", "chuyen"],
  description: "Tặng tiền cho người dùng khác",

  async execute(message, args) {
    // 1. Kiểm tra xem có tag người nhận không
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("⚠️ | Bạn cần tag người muốn tặng tiền! Ví dụ: `.give @user 100`.");
    }

    if (target.id === message.author.id) {
      return message.reply("⚠️ | Bạn không thể tự tặng tiền cho chính mình!");
    }

    if (target.bot) {
      return message.reply("⚠️ | Bạn không thể tặng tiền cho Bot!");
    }

    // 2. Kiểm tra số lượng tiền hợp lệ
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ | Vui lòng nhập số tiền hợp lệ để tặng!");
    }

    const senderId = message.author.id;
    const receiverId = target.id;

    // 3. Kiểm tra số dư của người gửi
    const senderBalance = await Money.getBalance(senderId);
    if (senderBalance < amount) {
      return message.reply(`❌ | Bạn không đủ tiền! Số dư hiện tại của bạn là: **${senderBalance}** ${Money.getIcon()}`);
    }

    try {
      // 4. Thực hiện chuyển tiền
      // Trừ tiền người gửi
      await Money.removeMoney(senderId, amount);
      // Cộng tiền người nhận
      await Money.addMoney(receiverId, amount);

      return message.channel.send(
        `✅ | **${message.author.username}** đã tặng **${amount}** ${Money.getIcon()} cho **${target.username}**!`
      );
    } catch (error) {
      console.error("Lỗi khi thực hiện lệnh give:", error);
      return message.reply("❌ | Đã xảy ra lỗi khi thực hiện giao dịch.");
    }
  },
};