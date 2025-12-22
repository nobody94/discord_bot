const Money = require("../utils/currency");
const ViWordchain = require("./wcViHandler");
const EnWordchain = require("./wcEnHandler");
const {errorIcon,verifyIcon} = require('../utils/icon');

async function wordchainProcess(message, wordchain) {
  const guildId = message.guildId;
  const userId = message.author.id;
  const content = message.content.trim().toLowerCase();   

  if (await wordchain.isRepeatPlayer(guildId, message.author.id)) {
    return message.reply({
      content: "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
      allowedMentions: { repliedUser: false },
    });
  }

  const result = await wordchain.gameProcess(guildId, content);

  if (result.success) {
    const tienThuong = 50;
    const userId = message.author.id;

    await wordchain.setLastUser(guildId, userId);

    await Money.addMoney(userId, tienThuong);

    await message.channel.send(
      `${verifyIcon} Từ hợp lệ ${
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
      setTimeout(async () => {
        // BƯỚC 1: Lấy từ mới trước
        const newStart = wordchain.getRandomWords(); 
        
        // BƯỚC 2: Bắt đầu game với từ đó
        await wordchain.startGame(guildId, newStart); 
        
        // BƯỚC 3: Lấy chữ cái cần nối tiếp
        const nextLetter = wordchain.getSecondPart(newStart); 

        message.channel.send(
          `🔄 **Ván mới bắt đầu!** Từ bắt đầu: **${newStart}**\nTừ tiếp theo phải bắt đầu bằng **"${nextLetter}"**`
        );
      }, 3000);
      return;
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

async function wordchainHandler(message) {
  const guildId = message.guildId;
  const viState = await ViWordchain.getWCViData(guildId);
  const enState = await EnWordchain.getWCEnData(guildId);  

  if (message.channelId === viState.channelId) {
    if (viState.gameActive) {
      return await wordchainProcess(message, ViWordchain);
    }
  }
  if (message.channelId === enState.channelId) {
    if (enState.gameActive) {
      return await wordchainProcess(message, EnWordchain);
    }
  }
}

module.exports = {
  wordchainHandler,
};
