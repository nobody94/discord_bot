const {enDictionary} = require('../game/dictionary');


const dictionary = enDictionary;
let gameActive = false;
let currentWord = null;
let lastUserId = null;
const wordHistory = new Set();

function getRandomWords() {
  const words = Array.from(dictionary);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
}

function isValidWord(word) {
  return dictionary.includes(word.toLowerCase());
}

function getSecondPart(word) {
  return word.slice(-1);
}

function getHint() {
  if (!gameActive || !currentWord) return null;

  const secondPart = getSecondPart(currentWord).toLowerCase();

  const matches = Array.from(dictionary).filter((word) => {
    const wLower = word.toLowerCase();
    return wLower.startsWith(secondPart + " ") && !wordHistory.has(wLower);
  });

  if (matches.length === 0) return null;

  // Trộn ngẫu nhiên danh sách kết quả
  const shuffled = matches.sort(() => 0.5 - Math.random());

  // Lấy tối đa 3 từ
  return shuffled.slice(0, 3);
}

function isGameActive() {
  return gameActive;
}

function getCurrentWord() {
  return currentWord;
}

function startGame(startingWord) {
  if (gameActive) {
    return false;
  }

  gameActive = true;
  lastUserId = null;
  wordHistory.clear();

  //Từ ngẫu nhiên khi bắt đầu game
  const firstPhrase = startingWord;
  currentWord = firstPhrase;
  wordHistory.add(firstPhrase);

  return true;
}

function stopGame() {
  if (!gameActive) {
    return 0;
  }

  gameActive = false;
  const totalWords = wordHistory.size;
  currentWord = null;
  lastUserId = null;
  wordHistory.clear();

  return totalWords;
}

function isRepeatPlayer(userId) {
  return lastUserId === userId; //
}

function setLastUser(userId) {
  lastUserId = userId; //
}

/*Xử lý lượt chơi và kiểm tra luật chơi*/

function gameProcess(newWord) {
  if (!gameActive)
    return {
      success: false,
      reason: "NOT_ACTIVE",
      message: "Game chưa hoạt động",
    };
  
  const secondWord = getSecondPart(newWord);  
 
  // Lấy tất cả từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = dictionary.filter((p) => {
    if (wordHistory.has(p)) return false;
    return getSecondPart(p) === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    gameActive = false;
    currentWord = null;
    wordHistory.clear();

    return {
      success: false,
      reason: "OUT_OF_WORD",
      message: "Hết từ để nối tiếp",
    };
  }

  // Kiểm tra hợp lệ theo từ điển
  if (!isValidWord(newWord)) {
    return {
      success: false,
      reason: "WORD_NOT_VALID",
      message: `❌ Từ này không có trong từ điển`,
    };
  }
  // Không lặp cụm
  if (wordHistory.has(newWord)) {
    return {
      success: false,
      reason: "WORD_DUPLICATE",
      message: "❌ Từ này đã được sử dụng",
    };
  }
  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  const currentLastWord = getSecondPart(currentWord);
  if (newWord[0] !== currentLastWord) {
    return {
      success: false,
      reason: "WRONG_START_WORD",
      message: `❌ Từ cần bắt đầu bằng ${currentLastWord}`,
    };
  }

  // Hợp lệ → cập nhật
  wordHistory.add(currentWord);
  currentWord = newWord;
  const nextRequiredWord = getSecondPart(newWord);

  return {
    success: true,
    nextRequiredWord: nextRequiredWord,
    currentWord: currentWord,
  };
}

module.exports = {
  isGameActive,
  getCurrentWord,
  startGame,
  stopGame,
  gameProcess,
  getSecondPart,
  getRandomWords,
  setLastUser,
  isRepeatPlayer,
  getHint,
};