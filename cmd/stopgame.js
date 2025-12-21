// File stopgame.js
const { setWordleData, getWordleData, gameTimers } = require("../game/wordleHandler"); // Thêm gameTimers vào đây

module.exports = {
  name: "stop",
  async execute(message, args) {
    const guildId = message.guild.id;
    const wordleData = await getWordleData(guildId);    
    
    if (message.channel.id == wordleData.channelId) {
      if (!wordleData.status) return;
      
      // --- PHẦN SỬA LỖI: Xóa bộ đếm giờ đang chạy ngầm ---
      if (gameTimers.has(guildId)) {
        clearTimeout(gameTimers.get(guildId));
        gameTimers.delete(guildId);
      }
      // ------------------------------------------------

      await setWordleData(guildId, {
        status: false,
        answer: null,
        turn: 0
      });

      return message.reply("🛑 Đã dừng trò chơi đoán chữ và hủy bộ đếm giờ thành công.");
    }
  },
};