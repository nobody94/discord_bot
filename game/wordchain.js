const Money = require("../utils/currency");
const ViWordchain = require("./wordchain-vi");
const EnWordchain = require("./wordchain-en");
const { getGameChannelId } = require("./game_settings");

async function gameProcess(message, wordchain) {
  const gameChannelId = getGameChannelId(message.guildId);
  const content = message.content.trim();
  const userId = message.author.id;
  if (gameChannelId && message.channelId !== gameChannelId) {
    return; // Bỏ qua nếu tin nhắn không ở đúng kênh game
  }

  if (wordchain.isRepeatPlayer(message.author.id)) {
    return message.reply({
      content: "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
      allowedMentions: { repliedUser: false },
    });
  }

  const result = wordchain.gameProcess(content);

  if (result.success) {
    const tienThuong = 50;
    wordchain.setLastUser(message.author.id);

    await Money.addMoney(userId, tienThuong);

    await message.channel.send(
      `✅ Từ hợp lệ ${
        message.author.username
      } được thưởng ${tienThuong} ${Money.getIcon()}\n` +
        `Từ tiếp theo phải bắt đầu bằng **"${result.nextRequiredWord}".`
    );
  } else {
    let replyMessage = result.message;
    if (result.reason == "OUT_OF_WORD") {
      const bonusReward = 500;
      await Money.addMoney(userId, bonusReward);
      await message.reply({
        content: `${replyMessage}\n ${
          message.author.username
        } được thưởng ${bonusReward} ${Money.getIcon()}`,
        allowedMentions: { repliedUser: false },
      });
      wordchain.stopGame();
      setTimeout(() => {
        const newStart = wordchain.getRandomWords();
        wordchain.startGame(newStart);
        message.channel.send(
          `🔄 **Ván mới bắt đầu!** Từ bắt đầu: **${newStart}**`
        );
      }, 3000);
    }
    if (result.reason == "LENGTH_OVER") {
      return;
    } else {
      await message
        .reply({
          content: replyMessage,
          allowedMentions: { repliedUser: false },
        })
        .then((msg) => {
          // Thiết lập thời gian chờ 10 giây (10000ms) trước khi xóa
          setTimeout(() => {
            msg
              .delete()
              .catch((err) => console.error("Không thể xóa tin nhắn:", err));
          }, 10000);
        });
    }
  }
}

function WordChain(message) {
  if (ViWordchain.isGameActive()) {
    gameProcess(message, ViWordchain);
  }
  if (EnWordchain.isGameActive()) {
    gameProcess(message, EnWordchain);
  }
}

module.exports = {
  WordChain,
};
