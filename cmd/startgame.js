const GameManager = require("../game/wordchain-vi");
const { getGameChannelId } = require("../game/game_settings");

module.exports = {
  name: "startgame",
  aliases: ["sg", "start"],
  description: "🎮 Bắt đầu trò chơi nối từ tiếng Việt.",

  async execute(message, args) {
    const gameChannelId = getGameChannelId(message.guildId);

    // Kiểm tra kênh đã thiết lập (nếu có)
    if (gameChannelId && message.channelId !== gameChannelId) {
      const designatedChannel = message.guild.channels.cache.get(gameChannelId);
      return message.reply({
        content: `Trò chơi phải được bắt đầu tại kênh đã thiết lập: ${
          designatedChannel ? designatedChannel.toString() : "Kênh đã bị xóa"
        }`,
        allowedMentions: { repliedUser: false },
      });
    }

    // Kiểm tra trạng thái game
    if (GameManager.isGameActive()) {
      const requiredWord = GameManager.getSecondPart(
        GameManager.getCurrentWord()
      );
      return message.reply({
        content: `Trò chơi đang diễn ra. Từ hiện tại là: **${GameManager.getCurrentWord()}**. Từ tiếp theo phải bắt đầu bằng **"${requiredWord}"**.`,
        allowedMentions: { repliedUser: false },
      });
    }
    //Bắt đầu game
    const startingWord = GameManager.getRandomWords();
    GameManager.startGame(startingWord);
    const nextRequiredWord = GameManager.getSecondPart(startingWord);

    await message.channel.send(
      "🎉 **Bắt đầu trò chơi Nối Từ Tiếng Việt!** 🎉\n" +
        `Từ bắt đầu: **${startingWord}**\n` +
        `Từ tiếp theo phải là một cụm 2 từ và phải bắt đầu bằng **"${nextRequiredWord}"**.`
    );
  },
};
