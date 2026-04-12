const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey, renderKey } = require("../utils/db.js");
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
  name: "migratepity",
  async execute(message, args) {
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    // Cú pháp: .migratepity [itemId] (ví dụ: .migratepity ruong_hiem)
    const targetItemId = args[0] || "tui_mu";
    
    const msg = await message.reply(`⏳ Đang bắt đầu chuyển đổi Pity cũ sang rương **${targetItemId}**...`);

    try {
      // Tải danh sách thành viên (tăng timeout lên 60s như file cũ của bạn)
      const members = await message.guild.members.fetch({ time: 60000 }).catch(() => null);
      
      if (!members) return msg.edit(`${errorIcon} | Lỗi: Không thể tải danh sách thành viên.`);

      let count = 0;

      for (const [userId, member] of members) {
        if (member.user.bot) continue; // Bỏ qua bot

        // 1. Key cũ dùng chung (nobody_bot_pity_counter_...)
        const oldPityKey = renderKey("pity_counter", userId);
        const oldPity = (await getKey(oldPityKey)) || 0;

        if (oldPity > 0) {
          // 2. Key mới cho từng loại rương (nobody_bot_pity_ruong_hiem_...)
          const newPityKey = renderKey(`pity_${targetItemId}`, userId);
          let currentNewPity = (await getKey(newPityKey)) || 0;

          // Cộng dồn Pity cũ vào Pity mới
          await setKey(newPityKey, currentNewPity + oldPity);
          
          // Reset Pity cũ về 0
          await setKey(oldPityKey, 0);
          
          count++;
        }
      }

      if (count > 0) {
        return msg.edit(`${verifyIcon} | Hoàn tất! Đã chuyển đổi Pity cho **${count}** thành viên sang rương \`${targetItemId}\`.`);
      } else {
        return msg.edit(`${errorIcon} | Không tìm thấy thành viên nào có Pity cũ để chuyển đổi.`);
      }

    } catch (error) {
      console.error(error);
      return msg.edit(`${errorIcon} | Đã xảy ra lỗi trong quá trình chuyển đổi.`);
    }
  },
};