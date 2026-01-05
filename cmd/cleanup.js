const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey, deleteKey, renderKey } = require("../utils/db");

module.exports = {
  name: "cleanup",
  description: "Xóa vĩnh viễn dữ liệu của người dùng đã rời server quá 7 ngày.",

  async execute(message, args) {
    // 1. Kiểm tra quyền hạn Developer
    const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
    if (!isDeveloper) {
      return message.reply({
        content: `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`,
        ephemeral: true,
      });
    }

    const guildId = message.guild.id;
    const key = `left_member_${guildId}`;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // Mốc 7 ngày
    const now = Date.now();

    try {
      // 2. Lấy danh sách chờ xóa của server hiện tại
      let leftList = await getKey(key);
      if (!leftList || !Array.isArray(leftList) || leftList.length === 0) {
        return message.reply(
          `${errorIcon} | Hiện tại không có dữ liệu người dùng nào đã rời server để dọn dẹp.`
        );
      }

      // 3. Phân loại người dùng
      const toDelete = leftList.filter((u) => now - u.leftAt >= SEVEN_DAYS);
      const stillWaiting = leftList.filter((u) => now - u.leftAt < SEVEN_DAYS);

      if (toDelete.length === 0) {
        return message.reply(
          `${errorIcon} | Không có người dùng nào rời server quá 7 ngày. (Đang chờ: **${stillWaiting.length}** người).`
        );
      }

      let deletedCount = 0;

      // 4. Quét và xóa dữ liệu vĩnh viễn
      for (const user of toDelete) {
        const listKey = [
          "inventory",
          "fishtank",
          "blackjack",
          "cooldown_cauca",
          "pity_counter",
          "fish_inv",
          "daily",
          "rpg_user",
          "mora",
          "primo"
        ];

        for (const type of listKey) {
          const dataKey = renderKey(type, user.userId);
          await deleteKey(dataKey);
        }

        // Xử lý hủy ngày sinh trong server này
        const birthdayKey = `birthday_${guildId}`;
        const birthData = (await getKey(birthdayKey)) || {};
        if (birthData[user.userId]) {
          delete birthData[user.userId]; // Xóa key khỏi Object

          // Sau khi xóa, lưu lại vào Database
          await setKey(birthdayKey, birthData);
        }

        // Xử lý hủy hôn ước trong server này
        const coupleKey = renderKey("couple", guildId);
        let couplesList = (await getKey(coupleKey)) || [];
        const newCouples = couplesList.filter(
          (c) => c.husband !== user.userId && c.wife !== user.userId
        );

        if (newCouples.length !== couplesList.length) {
          await setKey(coupleKey, newCouples);
        }

        deletedCount++;
      }

      // 5. Cập nhật lại danh sách chờ của Server
      if (stillWaiting.length > 0) {
        await setKey(key, stillWaiting);
      } else {
        await deleteKey(key);
      }

      // 6. Thông báo kết quả
      return message.reply(
        `${verifyIcon} | **Dọn dẹp hoàn tất!**\n` +
          `🗑️ Đã xóa dữ liệu của **${deletedCount}** người dùng cũ quá hạn.\n` +
          `📦 Còn lại **${stillWaiting.length}** người đang trong thời gian chờ dọn dẹp.`
      );
    } catch (error) {
      console.error("LỖI CLEANUP:", error);
      return message.reply(
        `${errorIcon} | Đã xảy ra lỗi khi truy xuất cơ sở dữ liệu.`
      );
    }
  },
};
