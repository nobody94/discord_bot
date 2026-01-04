const { renderKey, setKey, getKey } = require('../utils/db');
const { getBalance, removeMoney, getIcon } = require("../utils/currency.js");

module.exports = {
  name: "divorce",
  aliases: ["lyhon"],
  async execute(message) {
    const DIVORCE_FEE = 100000; // Phí ly hôn: 100,000 Mora
    const guildId = message.guild.id;
    const authorId = message.author.id;

    // 1. Lấy danh sách cặp đôi trong server
    const coupleKey = renderKey('couple', guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    // 2. Tìm xem người dùng có trong danh sách kết hôn không
    const coupleIndex = couplesList.findIndex(c => c.husband === authorId || c.wife === authorId);

    if (coupleIndex === -1) {
      return message.reply("❌ Bạn hiện đang độc thân, không thể thực hiện thủ tục ly hôn!");
    }

    // 3. Kiểm tra tiền phí ly hôn
    const balance = await getBalance(authorId, "mora");
    if (balance < DIVORCE_FEE) {
      return message.reply(`❌ Bạn không đủ tiền để ly hôn! Thủ tục này tốn **${DIVORCE_FEE.toLocaleString()}** ${getIcon("mora")}.`);
    }

    const coupleInfo = couplesList[coupleIndex];
    const partnerId = coupleInfo.husband === authorId ? coupleInfo.wife : coupleInfo.husband;

    // 4. Thực hiện trừ tiền và xóa dữ liệu
    try {
      await removeMoney(authorId, DIVORCE_FEE, "mora");

      // Xóa cặp đôi khỏi mảng
      couplesList.splice(coupleIndex, 1);
      await setKey(coupleKey, couplesList);

      message.reply(
        `💔 **CHÍNH THỨC LY HÔN**\n\n` +
        `<@${authorId}> đã hoàn tất thủ tục ly hôn với <@${partnerId}>.\n` +
        `💸 Bạn đã thanh toán **${DIVORCE_FEE.toLocaleString()}** ${getIcon("mora")} phí thủ tục giải quyết.`
      );
    } catch (error) {
      console.error("Lỗi ly hôn:", error);
      message.reply("❌ Có lỗi xảy ra trong quá trình xử lý thủ tục.");
    }
  }
};