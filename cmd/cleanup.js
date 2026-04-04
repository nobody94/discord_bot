const { DEVELOPER_IDS } = require("../utils/constant.js");
// Import db và các hàm hỗ trợ từ file db.js của bạn
const { db, renderKey, getKey, setKey, deleteKey } = require("../utils/db");

module.exports = {
  name: "cleanup",
  description: "Dọn dẹp dữ liệu người dùng (Hỗ trợ QuickMongo legacy scan).",

  async execute(message, args) {
    // 1. Kiểm tra quyền Developer
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const mode = args[0];
    const currentGuildId = message.guild.id;

    // Thay vì dùng các lệnh filter phức tạp của DB, hãy dùng .all()
    if (mode === "legacy") {
      const msg = await message.reply("🔍 Đang quét toàn bộ database (Phương thức an toàn cho Atlas M0)...");

      try {
        // Lấy tất cả record về RAM của bot
        const allRecords = await db.all();

        if (!Array.isArray(allRecords)) {
          return msg.edit("❌ Dữ liệu trả về không hợp lệ.");
        }

        const members = await message.guild.members.fetch();
        const currentMemberIds = new Set(members.keys());
        const currentGuildId = message.guild.id;

        let deletedCount = 0;
        const userDataTypes = ["inventory", "fishtank", "fish_inv", "daily", "rpg_user", "mora", "primo"];

        // Lọc thủ công bằng JavaScript (Không dùng $where của Mongo)
        for (const item of allRecords) {
          const key = item.ID;
          if (!key || typeof key !== 'string') continue;

          const isUserKey = userDataTypes.some(type => key.includes(`nobody_bot_${type}_`));

          if (isUserKey) {
            const idInKey = key.split('_').pop();

            if (idInKey !== currentGuildId && !currentMemberIds.has(idInKey)) {
              // Dùng hàm deleteKey bạn đã định nghĩa trong db.js
              await deleteKey(key);
              deletedCount++;
            }
          }
        }

        return msg.edit(`✅ Hoàn tất! Đã xóa **${deletedCount}** bản ghi rác mà không cần dùng lệnh $where.`);
      } catch (err) {
        console.error(err);
        return msg.edit(`❌ Lỗi: \`${err.message}\``);
      }
    }

    // --- CHẾ ĐỘ 2: BUILD (Khởi tạo danh sách cho tương lai) ---
    if (mode === "build") {
      const msg = await message.reply("🔄 Đang khởi tạo danh sách `all_users` từ thành viên hiện tại...");
      try {
        const members = await message.guild.members.fetch();
        const currentIds = Array.from(members.keys());
        await setKey("all_users", currentIds);
        return msg.edit(`✅ Đã lưu **${currentIds.length}** ID vào danh sách đối chiếu.`);
      } catch (err) {
        return msg.edit("❌ Lỗi khi khởi tạo danh sách.");
      }
    }

    // --- CHẾ ĐỘ 3: RUN (Dọn dẹp dựa trên all_users) ---
    if (mode === "run" || !mode) {
      const msg = await message.reply("🔄 Đang dọn dẹp theo danh sách `all_users`...");
      try {
        let allSavedUserIds = (await getKey("all_users")) || [];
        if (allSavedUserIds.length === 0) return msg.edit("⚠️ Trống danh sách `all_users`. Hãy chạy `.cleanup build` trước.");

        const members = await message.guild.members.fetch();
        const currentMemberIds = new Set(members.keys());
        let deletedCount = 0;
        const userDataTypes = ["inventory", "fishtank", "fish_inv", "daily", "rpg_user"];

        let newSavedUserIds = [];
        for (const savedId of allSavedUserIds) {
          if (!currentMemberIds.has(savedId)) {
            // Xóa các key cá nhân
            for (const type of userDataTypes) {
              await deleteKey(renderKey(type, savedId));
            }
            // Xóa thêm key mora (do key này không dùng renderKey chuẩn trong ảnh của bạn)
            await deleteKey(`nobody_bot_mora_${savedId}`);
            deletedCount++;
          } else {
            newSavedUserIds.push(savedId);
          }
        }

        await setKey("all_users", newSavedUserIds);
        return msg.edit(`✅ Đã dọn dẹp xong **${deletedCount}** người rời server.`);
      } catch (err) {
        return msg.edit("❌ Lỗi khi thực hiện dọn dẹp.");
      }
    }
  },
};