const Money = require("../utils/currency");
const ViWordchain = require("./wcViHandler");
const EnWordchain = require("./wcEnHandler");
const {getIcon} = require('../utils/currency');
const { errorIcon, verifyIcon } = require("../utils/icon");

async function wordchainProcess(message, wordchain) {
  const guildId = message.guildId;
  const userId = message.author.id;
  const content = message.content.trim().toLowerCase();

  // 1. Kiểm tra định dạng (Regex) trước - Bỏ qua nếu có icon/số
  const cleanRegex = /^[\p{L}\s]+$/u;
  if (!cleanRegex.test(content)) return;
  if(content.split(/\s+/).length >2) return;

  // 2. Kiểm tra người chơi lặp lại
  // Phải kiểm tra cái này TRƯỚC khi gọi gameProcess để chặn đứng Race Condition
  if (await wordchain.isRepeatPlayer(guildId, userId)) {
    return message.reply({
      content: "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
      allowedMentions: { repliedUser: false },
    });
  }

  // 3. BÂY GIỜ MỚI KHAI BÁO 'result'
  const result = await wordchain.gameProcess(guildId, content);
  if (result.reason === "INVALID_CHAR" || result.reason == "LENGTH_OVER")
    return;

  // 4. Xử lý kết quả sau khi đã có biến 'result'
  if (result.success) {
    const tienThuong = 50;

    // Cập nhật người dùng cuối ngay lập tức
    await wordchain.setLastUser(guildId, userId);
    await Money.addMoney(userId, tienThuong);

    await message.channel.send(
      `Từ hợp lệ **${message.author.username}** được thưởng ${tienThuong} ${getIcon}\n` +
        `Từ tiếp theo phải bắt đầu bằng **"${result.nextRequiredWord}"**.`
    );
  } else {
    // Chỉ xử lý lỗi nếu không phải lỗi ký tự (đã chặn ở bước 1)

    let replyMessage = result.message;

    if (result.reason === "OUT_OF_WORD") {
      const bonusReward = 500;
      await Money.addMoney(userId, bonusReward);

      await message.reply({
        content: `${replyMessage}\n🎉 **${message.author.username}** đã kết thúc chuỗi và nhận thưởng **${bonusReward}** ${getIcon}`,
        allowedMentions: { repliedUser: false },
      });

      await wordchain.stopGame(guildId);

      setTimeout(async () => {
        const newStart = wordchain.getRandomWords();
        await wordchain.startGame(guildId, newStart);
        const nextLetter = wordchain.getSecondPart(newStart);

        message.channel.send(
          `🔄 **Ván mới bắt đầu!** Từ bắt đầu: **${newStart}**\nTừ tiếp theo phải bắt đầu bằng **"${nextLetter}"**`
        );
      }, 3000);
      return;
    }

    // Các lỗi khác (sai từ bắt đầu, không có trong từ điển...)
    await message
      .reply({
        content: replyMessage,
        allowedMentions: { repliedUser: false },
      })
      .then((msg) => {
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      });
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
