const { DEVELOPER_IDS } = require("../utils/constant.js");
const { migrateData } = require("../utils/db.js");

module.exports = {
  name: "migrate",
  async execute(message, args) {
    // Chỉ Developer mới được chạy
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const msg = await message.reply(
      "⏳ Đang bắt đầu quá trình chuyển đổi dữ liệu..."
    );

    try {
      const guildId = message.guild.id;
      const newKey = `birthday_${guildId}`;

      // 1. Lấy toàn bộ thành viên trong Guild
      // Lưu ý: Cần bật Server Members Intent trong Developer Portal
      const members = await message.guild.members.fetch();
      let newGuildData = (await getKey(newKey)) || {};
      let count = 0;

      for (const [userId, member] of members) {
        // Key cũ theo logic renderKey("user_birthday", userId)
        // là: nobody_bot_user_birthday_ID
        const oldKey = `nobody_bot_user_birthday_${userId}`;
        const oldData = await getKey(oldKey);

        if (oldData) {
          // Nếu chưa có trong data mới thì mới cập nhật hoặc ghi đè
          if (!newGuildData[userId]) {
            newGuildData[userId] = oldData;
            count++;
          }
        }
      }

      if (count > 0) {
        await setKey(newKey, newGuildData);
        return msg.edit(
          `${verifyIcon} | Hoàn tất! Đã chuyển đổi **${count}** dữ liệu sinh nhật sang cấu trúc mới cho Server này.`
        );
      } else {
        return msg.edit("ℹ️ | Không tìm thấy dữ liệu cũ nào cần chuyển đổi.");
      }
    } catch (error) {
      console.error("Lỗi migratebirth:", error);
      return msg.edit(
        `${errorIcon} | Đã xảy ra lỗi trong quá trình chuyển đổi: ${error.message}`
      );
    }
  },
};
