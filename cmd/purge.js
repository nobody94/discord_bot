const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey, deleteKey } = require("../utils/db");
// Giả sử bạn export trực tiếp biến db từ QuickMongo trong file db.js
const { db } = require("../utils/db");

module.exports = {
  name: "purge",
  description: "Dọn dẹp dữ liệu của những người không còn ở trong server.",

  async execute(message, args) {
    const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
    if (!isDeveloper) {
      return message.reply(
        `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`
      );
    }

    const msg = await message.reply(
      "⏳ Đang phân tích cơ sở dữ liệu, quá trình này có thể mất một chút thời gian..."
    );

    try {
      const guild = message.guild;
      const listKeyTypes = [
        "inventory",
        "fishtank",
        "blackjack",
        "cooldown_cauca",
        "pity_counter",
        "fish_inv",
        "daily",
        "rpg_user",
        "mora",
        "primo",
      ];

      // 1. Lấy tất cả thành viên hiện tại (không dùng cache để tránh sót)
      const currentMembers = await guild.members.fetch();
      const memberIds = new Set(currentMembers.keys());

      // 2. Lấy TOÀN BỘ dữ liệu từ QuickMongo
      // QuickMongo.all() trả về mảng dạng: [{ ID: 'key_name', data: value }, ...]
      const allData = await db.all();

      let totalDeleted = 0;

      // 3. Lọc và xóa các key cá nhân
      for (const item of allData) {
        const fullKey = item.ID;

        // Kiểm tra xem key có bắt đầu bằng một trong các loại trong listKeyTypes không
        const prefix = listKeyTypes.find((type) =>
          fullKey.startsWith(`${type}_`)
        );

        if (prefix) {
          const parts = fullKey.split("_");
          const userId = parts.pop();
          // Nếu không có trong server thì xóa
          if (userId && !memberIds.has(userId)) {
            await deleteKey(fullKey);
            totalDeleted++;
          }
        }
      }

      // 4. Xử lý riêng cho Birthday (Dữ liệu dạng Object gom nhóm theo server)
      const birthdayKey = `birthday_${guild.id}`;
      let birthData = await getKey(birthdayKey);

      if (birthData && typeof birthData === "object") {
        let changed = false;
        for (const uId in birthData) {
          if (!memberIds.has(uId)) {
            delete birthData[uId];
            changed = true;
            totalDeleted++;
          }
        }
        if (changed) await setKey(birthdayKey, birthData);
      }

      return msg.edit(
        `${verifyIcon} | **Hoàn tất dọn dẹp tổng lực!**\n🗑️ Đã xóa **${totalDeleted}** mục dữ liệu của người cũ.`
      );
    } catch (error) {
      console.error("LỖI PURGE:", error);
      return msg.edit(`${errorIcon} | Đã xảy ra lỗi khi quét Database.`);
    }
  },
};
