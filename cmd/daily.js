const Money = require("../utils/currency");
const { renderKey, setKey, getKey } = require('../utils/db');

const DAILY_REWARD = 2000; 

module.exports = {
  name: "daily",
  description: "Nhận phần thưởng hàng ngày (Reset vào 4:00 sáng hàng ngày).",
  aliases: ["claim"],

  async execute(message, args) {
    const userId = message.author.id;
    const dailyKey = renderKey('daily', userId);
    const lastDaily = await getKey(dailyKey); 

    // 1. Lấy thời gian hiện tại theo VN (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Chuyển sang VN để tính toán mốc
    
    // 2. Thiết lập mốc Reset: 4h sáng hôm nay (theo giờ VN)
    const vnReset = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    vnReset.setUTCHours(4, 0, 0, 0); 

    // Nếu hiện tại VN chưa đến 4h sáng, mốc reset thực tế là 4h sáng hôm qua
    if (vnTime.getTime() < vnReset.getTime()) {
      vnReset.setUTCDate(vnReset.getUTCDate() - 1);
    }

    // Đưa mốc reset VN về lại giá trị timestamp chuẩn để so sánh với lastDaily
    const finalResetTimestamp = vnReset.getTime() - (7 * 60 * 60 * 1000);

    // 3. Kiểm tra Cooldown
    // Nếu lần cuối nhận thưởng (lastDaily) lớn hơn mốc reset gần nhất
    if (lastDaily && lastDaily > finalResetTimestamp) {
      
      const nextResetTimestamp = finalResetTimestamp + (24 * 60 * 60 * 1000);
      const timeRemaining = nextResetTimestamp - now.getTime();

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      return message.reply(
        `⏰ | Bạn đã nhận thưởng rồi! Quay lại sau **${hours} giờ ${minutes} phút ${seconds} giây** (Reset lúc 04:00 sáng).`
      );
    }

    // 4. Cộng tiền và lưu lại timestamp hiện tại
    await Money.addMoney(userId, DAILY_REWARD);
    await setKey(dailyKey, Date.now()); 

    return message.reply(
      `🎉 | Bạn đã nhận được **${DAILY_REWARD.toLocaleString()}** ${Money.getIcon()} quà hàng ngày!`
    );
  },
};