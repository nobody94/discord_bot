const { setWordleData, nextQuestion } = require("../game/wordleHandler"); // Thêm nextQuestion vào đây
const { verifyIcon, errorIcon } = require('../utils/icon.js');
const {DEVELOPER_IDS} = require('../utils/constant.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: "setwordle",
  description: "Thiết lập kênh và bắt đầu game đoán chữ",
  
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)|| !DEVELOPER_IDS.includes(message.author.id)) {
      return message.reply(`${errorIcon} Bạn cần quyền Quản lý kênh.`);
    }

    const channel = message.mentions.channels.first() || message.channel;

    // 1. Lưu ID kênh và kích hoạt trạng thái game
    await setWordleData(message.guild.id, {
        channelId: channel.id,
        status: true, // Kích hoạt game
        turn: 0       // Reset về lượt 0
    });

    await message.reply(`${verifyIcon} Đã thiết lập kênh tại: ${channel}. Game sẽ bắt đầu ngay bây giờ!`);

    // 2. Gọi nextQuestion để bắt đầu câu hỏi đầu tiên và chạy Timer 2 phút
    return nextQuestion(message, message.guild.id); 
  }
};