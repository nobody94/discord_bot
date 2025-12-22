const ViWordchain = require("../game/wcViHandler");
const EnWordchain = require("../game/wcEnHandler");

module.exports = {
  name: "restart",
  description: "Restart chơi game đoán chữ",

  async execute(message, args) {
    const guildId = message.guild.id;

    // Lệnh restart: restart
    const viState = await ViWordchain.getWCViData(guildId);
    const enState = await EnWordchain.getWCEnData(guildId);    

    // Kiểm tra và restart kênh tiếng Việt
    if (message.channel.id === viState.channelId) {
      await ViWordchain.stopGame(guildId); // Ép buộc stop
      const startingWord = ViWordchain.getRandomWords();
      await ViWordchain.startGame(guildId, startingWord); // Start mới
      const nextRequiredWord = ViWordchain.getSecondPart(startingWord);

      await message.reply(
        `🔄 **Đã khởi động lại ván đấu Tiếng Việt!**\nTừ bắt đầu: **${startingWord}**\nTiếp theo nối bằng: **"${nextRequiredWord}"**`
      );     
    }

    // Kiểm tra và restart kênh tiếng Anh
    if (message.channel.id === enState.channelId) {
      await EnWordchain.stopGame(guildId);
      const startingWord = EnWordchain.getRandomWords();
      await EnWordchain.startGame(guildId, startingWord);
      const nextRequiredWord = EnWordchain.getSecondPart(startingWord);

      await message.reply(
        `🔄 **Đã khởi động lại ván đấu Tiếng Anh!**\nTừ bắt đầu: **${startingWord}**\nTiếp theo nối bằng: **"${nextRequiredWord}"**`
      );     
    }
    
    return;
  },
};
