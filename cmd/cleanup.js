const { DEVELOPER_IDS } = require("../utils/constant.js");
const { renderKey, removeKey, getKey, setKey } = require("../utils/db");

module.exports = {
  name: "cleanup",
  description: "Dọn dẹp toàn bộ dữ liệu của những người không còn ở trong server.",

  async execute(message, args) {
    // 1. Kiểm tra quyền Developer
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    try {
      const msg = await message.reply("🔄 Đang bắt đầu quét toàn bộ database và danh sách thành viên...");

      // 2. Lấy danh sách ID hiện tại trong server (300 người)
      const members = await message.guild.members.fetch();
      const currentMemberIds = new Set(members.keys());

      // 3. Lấy danh sách tất cả ID đã từng lưu trong DB
      let allSavedUserIds = (await getKey("all_users")) || [];
      
      if (allSavedUserIds.length === 0) {
        return msg.edit("⚠️ Không tìm thấy danh sách `all_users` trong database để đối chiếu.");
      }

      let deletedCount = 0;
      const dataTypes = ["inventory", "tudo", "balance"]; // Các loại dữ liệu cần dọn
      let newSavedUserIds = [...allSavedUserIds];

      for (const savedId of allSavedUserIds) {
        // Nếu ID trong DB KHÔNG nằm trong server hiện tại
        if (!currentMemberIds.has(savedId)) {
          
          // Render key và xóa dữ liệu
          for (const type of dataTypes) {
            const key = renderKey(type, savedId);
            await removeKey(key);
          }

          // Loại bỏ ID khỏi danh sách quản lý chung
          newSavedUserIds = newSavedUserIds.filter(id => id !== savedId);
          deletedCount++;
        }
      }

      // 4. Cập nhật lại danh sách ID sạch vào DB
      await setKey("all_users", newSavedUserIds);

      return msg.edit(`✅ **Hoàn tất quét dọn!** Đã xóa dữ liệu của **${deletedCount}** người không còn ở server.`);

    } catch (err) {
      console.error(err);
      message.reply("❌ Lỗi khi thực hiện quét hệ thống.");
    }
  },
};