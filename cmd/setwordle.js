const { setWordleData } = require("../game/wordleHandler");
const { verifyIcon } = require('../utils/icon.js')

module.exports = {
  name: "setwordle",
  description: "Thiết lập kênh chơi game đoán chữ",
  
  async execute(message, args) {
    if (!message.member.permissions.has("MANAGE_CHANNELS")) {
      return message.reply("❌ Bạn cần quyền `Quản lý kênh`.");
    }

    const channel = message.mentions.channels.first() || message.channel;

    // Lưu ID kênh theo Guild ID: wordle_channel_guildID    
    await setWordleData(message.guild.id,{channelId:channel.id});

    return message.reply(`${verifyIcon} Đã thiết lập kênh chơi game đoán từ tại: ${channel}`);
  }
};