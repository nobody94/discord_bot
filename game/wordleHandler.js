const { renderKey, getKey, setKey } = require("../utils/db");
const { viDictionary } = require("../dictionary/dictionary");
const { getIcon, addMoney } = require("../utils/currency");

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

async function wordleProcess(message) {
  // 1. Lấy cấu hình từ DB
  const guildId = message.guild.id;
  const wordleData = await getWordleData(guildId);

  // 2. Kiểm tra điều kiện: Đúng kênh VÀ Game đang chạy
  if (message.channel.id !== wordleData.channelId || !wordleData.status) return;

  const dictionary = viDictionary;
  const currentAnswer = wordleData.answer; 
  
  // 4. Kiểm tra đáp án của người dùng
  const userGuess = message.content.toLowerCase().trim(); 
  if (userGuess === currentAnswer.toLowerCase()) {
    //có thể thêm thưởng tiền ở đây
    message.react("✅");

    const reward = 500;
    const userId = message.author.id;

    await addMoney(userId, reward);

    if (wordleData.turn >= 5) {
      // Kết thúc game sau 5 lượt
      await setWordleData(guildId, { status: false, answer: null, turns: 0 });
      return message.reply(
        `🎉 Chính xác! Bạn đã hoàn thành lượt cuối cùng và nhận được ${reward} ${getIcon()}. Game kết thúc! Để chơi tiếp hãy dùng lệnh \`.start\`.`
      );
    } else {     
      message.reply(
        `🎉 Chính xác! Đáp án là **${currentAnswer}**. Bạn nhận được ${reward} ${getIcon()}`
      );

      // Tự động tạo câu hỏi tiếp theo sau 3 giây
      setTimeout(async () => {
        const nextWord =
          dictionary[Math.floor(Math.random() * dictionary.length)];
        const nextShuffled = shuffleWord(nextWord);
        await setWordleData(guildId,{answer:nextWord,turn: wordleData.turn + 1})
        message.channel.send(`📝 Câu tiếp theo **Lượt ${wordleData.turn + 1}/5**: **${nextShuffled}**`);
      }, 3000);
    }
  }else{
    message.react("❌");
  }
}

module.exports = {
  wordleProcess,
  setWordleData,
  getWordleData,
  getRandomWord,
  shuffleWord
};
