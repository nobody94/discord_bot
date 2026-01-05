const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey, deleteKey, db,dbKey } = require("../utils/db");

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

      // 1. Fetch toàn bộ thành viên hiện tại
      const currentMembers = await guild.members.fetch();
      const memberIds = new Set(currentMembers.keys());

      // 2. Lấy toàn bộ dữ liệu từ QuickMongo
      if (!db) {
        throw new Error("Biến DB chưa được khởi tạo trong db.js");
      }
      const allData = await db.all();
      let totalDeleted = 0;

      // Regex kiểm tra xem một chuỗi có phải là ID Discord (Snowflake) hay không
      const isSnowflake = /^\d+$/;

      // 3. Lọc và xóa các key cá nhân
      for (const item of allData) {
        const fullKey = item.ID;

        // Kiểm tra xem key có bắt đầu bằng prefix + "_" hay không
        const prefix = listKeyTypes.find((type) =>
          fullKey.startsWith(`${dbKey}_${type}_`)
        );

        if (prefix) {
          const parts = fullKey.split("_");
          const userId = parts.pop(); // Lấy phần tử cuối cùng

          // ĐIỀU KIỆN XÓA:
          // 1. Phải có userId
          // 2. userId phải là định dạng số (tránh xóa nhầm key config_global)
          // 3. userId không có trong danh sách thành viên hiện tại
          if (userId && isSnowflake.test(userId) && !memberIds.has(userId)) {
            await deleteKey(fullKey);
            totalDeleted++;
          }
        }
      }

      // 4. Xử lý riêng cho Birthday
      const birthdayKey = `birthday_${guild.id}`;
      let birthData = await getKey(birthdayKey);

      if (birthData && typeof birthData === "object") {
        let changed = false;
        for (const uId in birthData) {
          // Chỉ xóa nếu uId là định dạng ID và không có trong server
          if (isSnowflake.test(uId) && !memberIds.has(uId)) {
            delete birthData[uId];
            changed = true;
            totalDeleted++;
          }
        }
        if (changed) await setKey(birthdayKey, birthData);
      }

      return msg.edit(
        `${verifyIcon} | **Hoàn tất dọn dẹp tổng lực!**\n🗑️ Đã xóa **${totalDeleted}** mục dữ liệu rác từ người không có trong server.`
      );
    } catch (error) {
      console.error("LỖI PURGE:", error);
      return msg.edit(`${errorIcon} | Đã xảy ra lỗi khi quét Database.`);
    }
  },
};
