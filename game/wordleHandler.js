const { renderKey, getKey, setKey } = require("../utils/db");
const { viDictionary } = require("../dictionary/dictionary");
const { getIcon, addMoney } = require("../utils/currency");
const {errorIcon,verifyIcon} = require('../utils/icon');

// Lưu trữ bộ đếm thời gian cho mỗi guild để tránh chồng chéo
const gameTimers = new Map();

function shuffleWord(word) {
  const chars = word.replace(/\s/g, "").split(""); 
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("/");
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

// Biến Lock để ngăn nhiều người cùng nhận thưởng một lúc
let isProcessing = false;

// Hàm xử lý chuyển câu tiếp theo hoặc kết thúc game
async function nextQuestion(message, guildId, isTimeout = false) {
  const wordleData = await getWordleData(guildId);
  
  // Xóa bộ đếm giờ cũ của guild này nếu có
  if (gameTimers.has(guildId)) {
    clearTimeout(gameTimers.get(guildId));
    gameTimers.delete(guildId);
  }

  // Nếu hết giờ mà không ai trả lời, thông báo đáp án
  if (isTimeout) {
    await message.channel.send(`⏰ **Hết giờ!** Đáp án của lượt này là: **${wordleData.answer}**`);
  }

  // Kiểm tra nếu đã hết 5 lượt
  if (wordleData.turn >= 5) {
    await setWordleData(guildId, { status: false, answer: null, turn: 0 });
    return message.channel.send(`🏁 Game đã kết thúc sau 5 lượt chơi! dùng lệnh .start để bắt đầu game`);
  }

  // Lấy từ mới và tăng số lượt (turn)
  const nextWord = viDictionary[Math.floor(Math.random() * viDictionary.length)];
  const nextShuffled = shuffleWord(nextWord);
  const nextTurn = wordleData.turn + 1;

  await setWordleData(guildId, {
    answer: nextWord,
    turn: nextTurn,
  });

  await message.channel.send(
    `📝 Câu tiếp theo\n**Lượt ${nextTurn}/5**: **${nextShuffled}**\n*(Bạn có 2 phút để trả lời)*`
  );

  // Thiết lập bộ đếm giờ mới: 2 phút (120.000 ms)
  const timer = setTimeout(() => {
    nextQuestion(message, guildId, true);
  }, 120000);
  
  gameTimers.set(guildId, timer);
  
  // Mở khóa cho phép xử lý câu trả lời mới
  isProcessing = false; 
}

async function wordleProcess(message) {
  const guildId = message.guild.id;
  const wordleData = await getWordleData(guildId);

  // 1. Kiểm tra điều kiện kênh và trạng thái game
  if (message.channel.id !== wordleData.channelId || !wordleData.status) return;

  // 2. Chặn nếu đang xử lý một người thắng khác
  if (isProcessing) return;

  // 3. Bỏ qua tin nhắn chỉ có Icon/Emoji
  const content = message.content.trim();
  const discordEmojiRegex = /^<a?:\w+:\d+>$/;
  const unicodeEmojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/;

  if (discordEmojiRegex.test(content) || unicodeEmojiRegex.test(content)) return;

  const currentAnswer = wordleData.answer;
  const userGuess = content.toLowerCase();

  // Bỏ qua nếu tin nhắn quá dài (> 2 từ)
  if (userGuess.split(/\s+/).length > 2) return;

  // 4. Kiểm tra đáp án
  if (userGuess === currentAnswer.toLowerCase()) {
    isProcessing = true; // Khóa xử lý
    message.react(`✅`);
    
    const reward = 500;
    await addMoney(message.author.id, reward);

    await message.reply(
      `🎉 Chính xác! Đáp án là **${currentAnswer}**. Bạn nhận được ${reward} ${getIcon()}`
    );

    // Đợi 3 giây rồi mới chuyển sang câu tiếp theo
    setTimeout(() => {
      nextQuestion(message, guildId, false);
    }, 3000);

  } else {
    // Nếu sai, chỉ react icon lỗi (không khóa isProcessing)
    message.react(`❌`);
  }
}

module.exports = {
  wordleProcess,
  setWordleData,
  getWordleData,
  shuffleWord,
  nextQuestion,
  gameTimers
};
