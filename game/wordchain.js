const Money = require("../utils/currency");
const ViWordchain = require("./wordchain-vi");
const EnWordchain = require("./wordchain-en");

async function gameProcess(message, wordchain) {
  const guildId = message.guildId;
  const content = message.content.trim();

  const result = await wordchain.gameProcess(guildId, content);

  if (wordchain.isRepeatPlayer(guildId, message.author.id)) {
    return message.reply({
      content: "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
      allowedMentions: { repliedUser: false },
    });
  }

  if (result.success) {
    const tienThuong = 50;
    wordchain.setLastUser(guildId, message.author.id);

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
      await wordchain.stopGame(guildId);
      const startgame = await wordchain.startGame(guildId, newStart);
      setTimeout(() => {
        const newStart = wordchain.getRandomWords();
        startgame;
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

async function WordChain(message) {
  const guildId = message.guildId;
  const viState = await ViWordchain.getGameState(guildId);
  const enState = await EnWordchain.getGameState(guildId);

  if (viState.gameActive && message.channelId === viState.channelId) {
    return await gameProcess(message, ViWordchain);
  }
  if (enState.gameActive && message.channelId === enState.channelId) {
    return await gameProcess(message, EnWordchain);
  }
}

module.exports = {
  WordChain,
};
