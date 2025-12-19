const { renderKey,setKey } = require("../utils/db"); // Đường dẫn đến nơi bạn khởi tạo db

module.exports = {
  name: "setwordle",
  description: "Thiết lập kênh chơi game đoán chữ",
  
  async execute(message, args) {
    if (!message.member.permissions.has("MANAGE_CHANNELS")) {
      return message.reply("❌ Bạn cần quyền `Quản lý kênh`.");
    }

    const channel = message.mentions.channels.first() || message.channel;

    // Lưu ID kênh theo Guild ID: wordle_channel_guildID
    const dbKey = renderKey('wordle_channel',message.guild.id);
    await setKey(dbKey,channel._id);

    return message.reply(`✅ Đã thiết lập kênh chơi game tại: ${channel}`);
  }
};