const { DEVELOPER_IDS } = require('../utils/constant.js');
const {migrateLeaderboard} = require('../utils/db.js');

module.exports = {
  name: "fish-migrate",
  async execute(message, args) {
    // Chỉ Developer mới được chạy
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const guildId = message.guild.id;
    
    // Chuyển đổi cả 2 bảng xếp hạng
    const missSuccess = await migrateLeaderboard("miss", guildId);
    const trashSuccess = await migrateLeaderboard("trash", guildId);

    if (missSuccess || trashSuccess) {
      message.reply(`✅ Đã cập nhật dữ liệu cũ vào bảng xếp hạng của server: **${message.guild.name}**`);
    } else {
      message.reply("❌ Không tìm thấy dữ liệu cũ hoặc dữ liệu đã được chuyển đổi trước đó.");
    }
  }
};