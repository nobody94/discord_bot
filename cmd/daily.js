const Money = require("../utils/currency");
const { renderKey, setKey, getKey } = require('../utils/db');

const DAILY_REWARD = 500; // Số tiền thưởng mỗi ngày

module.exports = {
  name: "daily",
  description: "Nhận phần thưởng hàng ngày (Reset vào 4:00 sáng hàng ngày).",
  aliases: ["claim"],

  async execute(message, args) {
    const userId = message.author.id;
    const dailyKey = renderKey('daily', userId); //

    // 1. Lấy thời điểm claim cuối cùng từ Database
    const lastDaily = await getKey(dailyKey); //

    // 2. Tính toán thời điểm Reset (4h sáng hôm nay)
    const now = new Date();
    const lastReset = new Date();
    lastReset.setHours(4, 0, 0, 0); // Thiết lập mốc 4:00:00 sáng

    // Nếu hiện tại chưa đến 4h sáng, thì mốc reset thực tế phải là 4h sáng ngày hôm qua
    if (now < lastReset) {
      lastReset.setDate(lastReset.getDate() - 1);
    }

    // 3. Kiểm tra Cooldown
    // Nếu lastDaily tồn tại và lớn hơn lastReset, nghĩa là người dùng đã nhận thưởng sau mốc 4h sáng gần nhất
    if (lastDaily !== null && lastDaily > lastReset.getTime()) {
      
      // Tính thời gian chờ đến 4h sáng ngày tiếp theo
      const nextReset = new Date(lastReset);
      nextReset.setDate(nextReset.getDate() + 1);
      
      const timeRemaining = nextReset.getTime() - now.getTime();

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      let timeString = "";
      if (hours > 0) timeString += `${hours} giờ, `;
      if (minutes > 0) timeString += `${minutes} phút, `;
      timeString += `${seconds} giây`;

      return message.reply(
        `⏰ | Bạn đã nhận thưởng rồi! Phần thưởng tiếp theo sẽ có lúc **04:00 sáng** (còn **${timeString}**).`
      );
    } else {
      // Trường hợp: Đã qua mốc 4h sáng hoặc đây là lần claim đầu tiên

      // 4. Cộng tiền và cập nhật thời điểm claim
      await Money.addMoney(userId, DAILY_REWARD); //
      await setKey(dailyKey, Date.now()); // Lưu lại thời điểm hiện tại

      // 5. Gửi thông báo thành công
      return message.reply(
        `🎉 | Chúc mừng! Bạn đã nhận được **${DAILY_REWARD}** ${Money.getIcon()} thưởng hàng ngày (Reset vào 4h sáng).`
      ); //
    }
  },
};