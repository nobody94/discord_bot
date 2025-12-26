const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey } = require("../utils/db.js");
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
  name: "migrate",
  async execute(message, args) {
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const msg = await message.reply("⏳ Đang bắt đầu chuyển đổi dữ liệu (Có thể mất 1-2 phút)...");

    try {
      const guildId = message.guild.id;
      const newKey = `birthday_${guildId}`;
      
      // Khắc phục lỗi Timeout: Tăng thời gian chờ lên 60s
      const members = await message.guild.members.fetch({ time: 60000 }).catch(() => null);
      
      if (!members) return msg.edit(`${errorIcon} | Lỗi: Không thể tải danh sách thành viên. Kiểm tra 'Server Members Intent'.`);

      let newGuildData = (await getKey(newKey)) || {};
      let count = 0;

      for (const [userId, member] of members) {
        // Cấu trúc cũ bạn đang dùng là renderKey("user_birthday", userId)
        // Trong db.js renderKey mặc định thêm prefix "nobody_bot"
        const oldKey = `nobody_bot_user_birthday_${userId}`;
        const oldData = await getKey(oldKey);

        if (oldData && !newGuildData[userId]) {
          newGuildData[userId] = oldData;
          count++;
        }
      }

      if (count > 0) {
        await setKey(newKey, newGuildData);
        return msg.edit(`${verifyIcon} | Hoàn tất! Đã gộp **${count}** sinh nhật vào key Server: \`${newKey}\`.`);
      } else {
        return msg.edit("ℹ️ | Không tìm thấy dữ liệu cũ hoặc dữ liệu đã được gộp trước đó.");
      }
    } catch (error) {
      console.error("Lỗi migrate:", error);
      return msg.edit(`${errorIcon} | Lỗi: ${error.message}`);
    }
  },
};