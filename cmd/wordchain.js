const GameManager = require("../game/wordchain-vi");
const { setGameChannelId } = require('../game/game_settings');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: "setwordchain-vi",
  aliases: ["noichu-vi"],
  description: "Thiết lập kênh và bắt đầu trò chơi nối từ.",
  
  async execute(message, args) {
    // 1. Kiểm tra quyền hạn
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply("❌ Bạn cần quyền `Quản lý kênh` để thiết lập trò chơi.");
    }

    const guildId = message.guildId;
    const selectedChannel = message.channel;

    // 2. Thiết lập kênh game (Lưu vào game_settings)
    setGameChannelId(guildId, selectedChannel.id);

    // 3. Kiểm tra nếu game đang chạy thì reset/stop để bắt đầu ván mới hoàn toàn
    if (GameManager.isGameActive()) {
        GameManager.stopGame(); 
    }

    // 4. Khởi tạo từ bắt đầu
    const startingWord = GameManager.getRandomWords();
    GameManager.startGame(startingWord);
    const nextRequiredWord = GameManager.getSecondPart(startingWord);

    await message.reply({
        content: `✅ Đã thiết lập **${selectedChannel}** làm kênh nối từ.\n` +
                 `🎉 **Trò chơi bắt đầu ngay bây giờ!** 🎉\n` +
                 `Từ bắt đầu: **${startingWord}**\n` +
                 `Từ tiếp theo phải bắt đầu bằng **"${nextRequiredWord}"**.`,
        allowedMentions: { repliedUser: false }
    });
  },
};