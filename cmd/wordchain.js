const ViWordchain = require("../game/wcViHandler");
const EnWordchain = require("../game/wcEnHandler");
const {DEVELOPER_IDS} = require('../utils/constant.js');

module.exports = {
  name: "wordchain",
  description: "Thiết lập kênh chơi game đoán chữ",

  async execute(message, args) {
    if (!message.member.permissions.has("MANAGE_CHANNELS") || !DEVELOPER_IDS.includes(message.author.id)) {
      return message.reply("Bạn cần quyền `Quản lý kênh`.");
    }

    if (!args[0]) {
      return message.reply(
        `Bạn phải dùng lệnh .wordchain vi/en để set channel thành game nối từ Tiếng Việt/Tiếng Anh`
      );
    }

    const channel = message.mentions.channels.first() || message.channel;
    const guildId = message.guild.id;
  
    if (args[0] === "vi") {
      // Lưu ID kênh theo Guild ID
      await ViWordchain.setWCViData(guildId, {
        channelId: channel.id,
        lastUserId: null,
        wordHistory: [],
        gameActive:false
      });

      if (await ViWordchain.isGameActive(guildId)) {
        await ViWordchain.stopGame();
      }

      const startingWord = ViWordchain.getRandomWords();
      await ViWordchain.startGame(guildId, startingWord);
      const nextRequiredWord = ViWordchain.getSecondPart(startingWord);

      await message.reply({
        content:
          `Đã thiết lập **${channel}** làm kênh nối từ Tiếng Việt.\n` +
          `🎉 **Trò chơi bắt đầu ngay bây giờ!** 🎉\n` +
          `Từ bắt đầu: **${startingWord}**\n` +
          `Từ tiếp theo phải bắt đầu bằng **"${nextRequiredWord}"**.`,
        allowedMentions: { repliedUser: false },
      });
    }

    if (args[0] === "en") {
      // Lưu ID kênh theo Guild ID
      await EnWordchain.setWCEnData(guildId, {
        channelId: channel.id,
        lastUserId: null,
        wordHistory: [],
        gameActive:false
      });

      if (await EnWordchain.isGameActive(guildId)) {
        EnWordchain.stopGame();
      }

      const startingWord = EnWordchain.getRandomWords();
      await EnWordchain.startGame(guildId, startingWord);
      const nextRequiredWord = EnWordchain.getSecondPart(startingWord);

      await message.reply({
        content:
          `Đã thiết lập **${channel}** làm kênh nối từ Tiếng Anh.\n` +
          `🎉 **Trò chơi bắt đầu ngay bây giờ!** 🎉\n` +
          `Từ bắt đầu: **${startingWord}**\n` +
          `Từ tiếp theo phải bắt đầu bằng **"${nextRequiredWord}"**.`,
        allowedMentions: { repliedUser: false },
      });
    }
  },
};
