const Money = require("../utils/currency");
const {renderKey,setKey,getKey} = require('../utils/db');

const DAILY_REWARD = 500; // Số tiền thưởng mỗi ngày
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 giờ tính bằng mili-giây

module.exports = {
  name: "daily",
  description: "Nhận phần thưởng tiền tệ hàng ngày (sau mỗi 24 giờ).",
  aliases: ["dl", "claim"],

  async execute(message, args) {
    const userId = message.author.id;
    const dailyKey = renderKey('daily',userId); // Key mới để theo dõi thời gian claim

    // 2. Lấy thời điểm claim cuối cùng
    const lastDaily = await getKey(dailyKey);

    // 3. Kiểm tra Cooldown
    if (lastDaily !== null && COOLDOWN - (Date.now() - lastDaily) > 0) {
      // Trường hợp: Chưa đủ 24 giờ

      const timeRemaining = COOLDOWN - (Date.now() - lastDaily);

      // Chuyển đổi mili-giây thành giờ, phút, giây
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      let timeString = "";
      if (hours > 0) timeString += `${hours} giờ, `;
      if (minutes > 0) timeString += `${minutes} phút, `;
      timeString += `${seconds} giây`;

      return message.reply(
        `⏰ | Bạn đã nhận thưởng hôm nay rồi! Vui lòng chờ **${timeString}** nữa.`
      );
    } else {
      // Trường hợp: Đã đủ 24 giờ hoặc đây là lần claim đầu tiên

      // 4. Cộng tiền và cập nhật thời điểm claim
      await Money.addMoney(userId, DAILY_REWARD);
      await setKey(dailyKey,Date.now())// Lưu lại thời điểm hiện tại

      // 5. Gửi thông báo thành công
      return message.reply(
        `🎉 | Chúc mừng! Bạn đã nhận được **${DAILY_REWARD}** ${Money.getIcon()} thưởng hàng ngày.`
      );
    }
  },
};
