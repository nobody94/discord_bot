const GameManager = require("../game/wordchain-en");
const { PermissionFlagsBits } = require("discord.js");
const { checkHintLimit } = require("../utils/currency");
const { updateGameState, getGameState } = require("../game/wordchain-en");

module.exports = {
  name: "setwordchain-en",
  aliases: ["noichu-en", "hint", "stop-en"],
  description: "Thiết lập kênh và bắt đầu trò chơi nối từ.",

  async execute(message, args, commandName) {
    const guildId = message.guildId;
    const currentChannelId = message.channelId;
    const selectedChannel = message.channel;
    const state = await getGameState(guildId);
    const gameChannelId = state.channelId;
    //hint
    if (state.gameActive && message.channelId === state.channelId) {
      const isHintShortcut = ["hint"].includes(commandName);
      const isStop = ["stop-en"].includes(commandName);
      if (isHintShortcut) {
        if (currentChannelId !== gameChannelId) {
          return message.reply(
            "❌ | Bạn chỉ có thể dùng lệnh gợi ý trong đúng kênh chơi game!"
          );
        }

        if (await !GameManager.isGameActive()) {
          return message.reply("❌ | Game chưa bắt đầu!");
        }

        const userId = message.author.id;

        const hintStatus = await checkHintLimit("wordchain_en", userId);

        if (!hintStatus.canUse) {
          return message.reply(
            "⚠️ | Bạn đã hết 5 lượt gợi ý miễn phí của ngày hôm nay rồi!"
          );
        }

        const hint = GameManager.getHint(state);
        if (!hint) {
          return message.reply("😅 | Không tìm thấy từ nào hợp lệ để gợi ý!");
        }

        // Tăng số lượt đã dùng
        const remaining = hintStatus.remaining;

        return message.reply({
          content: `💡 | Gợi ý: **||${hint.join(
            ", "
          )}||**\n(Bạn còn **${remaining}/5** lượt dùng hôm nay)`,
          allowedMentions: { repliedUser: false },
        });
      }
      if (isStop) {
        GameManager.stopGame();

        const newStart = GameManager.getRandomWords();
        await GameManager.startGame(guildId, newStart);
        return message.reply(
          `🛑 Đã dừng ván cũ. 🔄 Ván mới bắt đầu với từ: **${newStart}**`
        );
      }
    }    

    // 1. Kiểm tra quyền hạn
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply(
        "❌ Bạn cần quyền `Quản lý kênh` để thiết lập trò chơi."
      );
    }

    // 2. Thiết lập kênh game (Lưu vào game_settings)
    const isCommand = ["setwordchain-en"].includes(commandName);
    if (isCommand) {
      await updateGameState(guildId, { channelId: selectedChannel.id });
    } else {
      return;
    }

    if (currentChannelId !== gameChannelId) {
      return;
    }

    // 3. Kiểm tra nếu game đang chạy thì reset/stop để bắt đầu ván mới hoàn toàn
    if (await GameManager.isGameActive()) {
      GameManager.stopGame();
    }

    // 4. Khởi tạo từ bắt đầu
    const startingWord = GameManager.getRandomWords();
    await GameManager.startGame(startingWord);
    const nextRequiredWord = GameManager.getSecondPart(startingWord);

    await message.reply({
      content:
        `✅ Đã thiết lập **${selectedChannel}** làm kênh nối từ Tiếng Anh.\n` +
        `🎉 **Trò chơi bắt đầu ngay bây giờ!** 🎉\n` +
        `Từ bắt đầu: **${startingWord}**\n` +
        `Từ tiếp theo phải bắt đầu bằng **"${nextRequiredWord}"**.`,
      allowedMentions: { repliedUser: false },
    });
  },
};
