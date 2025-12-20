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

    // 1. Lấy thời gian hiện tại theo UTC+7
    const now = new Date();
    
    // 2. Thiết lập mốc Reset: 4h sáng hôm nay
    const lastReset = new Date();
    lastReset.setHours(4, 0, 0, 0); 

    // Nếu bây giờ chưa đến 4h sáng, mốc reset thực tế phải là 4h sáng ngày hôm qua
    if (now.getTime() < lastReset.getTime()) {
      lastReset.setDate(lastReset.getDate() - 1);
    }

    // 3. Kiểm tra Cooldown
    // Nếu thời điểm nhận cuối cùng (lastDaily) nằm SAU mốc Reset gần nhất, nghĩa là đã nhận rồi
    if (lastDaily && lastDaily > lastReset.getTime()) {
      
      // Tính thời gian chờ đến 4h sáng ngày tiếp theo
      const nextReset = new Date(lastReset.getTime());
      nextReset.setDate(nextReset.getDate() + 1);
      
      const timeRemaining = nextReset.getTime() - now.getTime();

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      return message.reply(
        `⏰ | Bạn đã nhận thưởng rồi! Phần thưởng tiếp theo sẽ có lúc **04:00 sáng** (còn **${hours} giờ ${minutes} phút ${seconds} giây**).`
      );
    }

    // 4. Cộng tiền và cập nhật thời điểm claim
    await Money.addMoney(userId, DAILY_REWARD);
    await setKey(dailyKey, Date.now()); 

    return message.reply(
      `🎉 | Chúc mừng! Bạn đã nhận được **${DAILY_REWARD}** ${Money.getIcon()} thưởng hàng ngày.`
    );
  },
};