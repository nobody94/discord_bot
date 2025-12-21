const { renderKey, getKey, setKey } = require("../utils/db");
const { viDictionary } = require("../dictionary/dictionary");
const { getIcon, addMoney } = require("../utils/currency");
const {errorIcon,verifyIcon} = require('../utils/icon');

function shuffleWord(word) {
  const chars = word.replace(/\s/g, "").split(""); // Loại bỏ khoảng trắng và tách chữ
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("/");
}

function getRandomWord() {
  const dictionary = viDictionary;
  const words = Array.from(dictionary);
  let startingWord = words[Math.floor(Math.random() * words.length)];

  return startingWord;
}

async function getWordleData(guildId) {
  const dbKey = renderKey("wordle_game", guildId);
  return (
    (await getKey(dbKey)) || {
      channelId: null,
      status: false,
      answer: null,
      turn: 0,
    }
  );
}

async function setWordleData(guildId, data) {
  const dbKey = renderKey("wordle_game", guildId);
  const currentData = await getWordleData(guildId);
  return await setKey(dbKey, { ...currentData, ...data });
}

let isProcessing = false;

async function wordleProcess(message) {
  const guildId = message.guild.id;
  const wordleData = await getWordleData(guildId);

  // 1. Kiểm tra điều kiện kênh và trạng thái game
  if (message.channel.id !== wordleData.channelId || !wordleData.status) return;

  // 2. Kiểm tra nếu đang có một câu trả lời khác đang được xử lý (Lock)
  if (isProcessing) return;

  // --- KIỂM TRA TIN NHẮN CHỈ CHỨA ICON ---
  const content = message.content.trim();
  
  // Regex này kiểm tra nếu tin nhắn chỉ chứa emoji của Discord hoặc emoji hệ thống
  const discordEmojiRegex = /^<a?:\w+:\d+>$/;
  const unicodeEmojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/;

  if (discordEmojiRegex.test(content) || unicodeEmojiRegex.test(content)) {
    return; // Bỏ qua, không react và không tính là sai
  }

  const currentAnswer = wordleData.answer;
  const userGuess = message.content.toLowerCase().trim();

  // Bỏ qua nếu tin nhắn quá dài
  if (userGuess.split(/\s+/).length > 2) return;

  // 3. Nếu trả lời đúng
  if (userGuess === currentAnswer.toLowerCase()) {
    // KÍCH HOẠT LOCK: Chặn tất cả các tin nhắn đúng đến sau
    isProcessing = true; 

    message.react(`${verifyIcon}`);
    const reward = 500;
    const userId = message.author.id;
    await addMoney(userId, reward);

    if (wordleData.turn >= 5) {
      await setWordleData(guildId, { status: false, answer: null, turn: 0 });
      message.reply(
        `🎉 Chính xác! Bạn đã hoàn thành lượt cuối cùng và nhận được ${reward} ${getIcon()}. Game kết thúc!`
      );
      // MỞ LOCK sau khi hoàn tất
      isProcessing = false; 
      return;
    } else {
      await message.reply(
        `🎉 Chính xác! Đáp án là **${currentAnswer}**. Bạn nhận được ${reward} ${getIcon()}`
      );

      // Tự động tạo câu hỏi tiếp theo sau 3 giây
      setTimeout(async () => {
        const dictionary = viDictionary;
        const nextWord = dictionary[Math.floor(Math.random() * dictionary.length)];
        const nextShuffled = shuffleWord(nextWord);

        await setWordleData(guildId, {
          answer: nextWord,
          turn: wordleData.turn + 1,
        });

        await message.channel.send(
          `📝 Câu tiếp theo **Lượt ${wordleData.turn + 1}/5**: **${nextShuffled}**`
        );

        // MỞ LOCK: Cho phép người dùng trả lời câu hỏi mới
        isProcessing = false; 
      }, 3000);
    }
  } else {
    // Nếu sai thì không cần lock, người khác vẫn có thể trả lời tiếp
    message.react(`${errorIcon}`);
  }
}

module.exports = {
  wordleProcess,
  setWordleData,
  getWordleData,
  getRandomWord,
  shuffleWord,
};
