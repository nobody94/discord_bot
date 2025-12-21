const { renderKey, getKey, setKey } = require("../utils/db");
const { enDictionary } = require("../dictionary/dictionary");
const {errorIcon} = require('../utils/icon');

async function getWCEnData(guildId) {
  const dbKey = renderKey("wordchain_en", guildId);
  const data = await getKey(dbKey);
  return (
    data || {
      gameActive: false,
      currentWord: null,
      lastUserId: null,
      wordHistory: [],
      channelId: null,
    }
  );
}

async function setWCEnData(guildId, data) {
  const dbKey = renderKey("wordchain_en", guildId);
  const currentData = await getWCEnData(guildId);
  return await setKey(dbKey, { ...currentData, ...data });
}

function getRandomWords() {
  const dictionary = enDictionary;
  const words = Array.from(dictionary);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
}

function isValidWord(word) {
  const dictionary = enDictionary;
  // Regex kiểm tra: Chỉ cho phép chữ cái, không cho phép số hoặc ký hiệu
  // ^: bắt đầu, $: kết thúc, [a-zA-ZÀ-ỹ]: các ký tự chữ cái tiếng Việt và tiếng Anh
  const onlyLetters = /^[a-z]+$/;

  if (!onlyLetters.test(word)) {
    return false; // Trả về false nếu có số hoặc ký hiệu dính kèm
  }

  const lowerWord = word.toLowerCase();

  return dictionary.includes(lowerWord);
}

function getSecondPart(word) {
  if (!word || typeof word !== 'string') return "";
  return word.slice(-1);
}

function getHint(state) {
  if (!state.gameActive || !state.currentWord) return null;

  const dictionary = enDictionary;
  const secondPart = getSecondPart(state.currentWord).toLowerCase();

  const matches = Array.from(dictionary).filter((word) => {
    const wLower = word.toLowerCase();
    return wLower.startsWith(secondPart) && !state.wordHistory.includes(wLower);
  });

  if (matches.length === 0) return null;

  // Trộn ngẫu nhiên danh sách kết quả
  const shuffled = matches.sort(() => 0.5 - Math.random());

  // Lấy tối đa 3 từ
  return shuffled.slice(0, 3);
}

async function isGameActive(guildId) {
  const state = await getWCEnData(guildId);
  return state.gameActive;
}

async function startGame(guildId, startingWord) {
  const state = await getWCEnData(guildId);
 
  if (state.gameActive) {
    return false;
  }
  
  await setWCEnData(guildId, {
    gameActive: true,
    currentWord: startingWord,
    lastUserId: null,
    wordHistory: [startingWord.toLowerCase()],
  });
  return true;
}

async function stopGame(guildId) {
  const state = await getWCEnData(guildId);
  if (!state.gameActive) {
    return 0;
  }

  await setWCEnData(guildId, {
    gameActive: false,
    currentWord: null,
    lastUserId: null,
    wordHistory: [],
  });

  const totalWords = state.wordHistory.length;

  return totalWords;
}

async function isRepeatPlayer(guildId, userId) {
  const state = await getWCEnData(guildId);
  if (!state || !state.lastUserId) return false;
  return state.lastUserId === userId;
}

async function setLastUser(guildId, userId) {
  await setWCEnData(guildId, {
    lastUserId: userId,
  });
}

async function gameProcess(guildId, newWord) {
  const enState = await getWCEnData(guildId);

  if (!enState.gameActive)
    return {
      success: false,
      reason: "NOT_ACTIVE",
      message: "Game chưa hoạt động",
    };
  const dictionary = enDictionary;
  const secondWord = getSecondPart(newWord);
  const parts = newWord.split(/\s+/);
  if (parts.length > 1) {
    return {
      success: false,
      reason: "LENGTH_OVER",
      message: "",
    };
  }

  // Kiểm tra hợp lệ theo từ điển
  if (!isValidWord(newWord)) {
    return {
      success: false,
      reason: "WORD_NOT_VALID",
      message: `${errorIcon} Từ này không có trong từ điển`,
    };
  }

  // Lấy tất cả từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = dictionary.filter((p) => {
    if (enState.wordHistory.includes(p)) return false;
    return getSecondPart(p) === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    await setWCEnData(guildId, {
      gameActive: null,
      currentWord: null,
      lastUserId: null,
      wordHistory: [],
    });

    return {
      success: false,
      reason: "OUT_OF_WORD",
      message: "Hết từ để nối tiếp",
    };
  }

  // Không lặp cụm
  if (enState.wordHistory.includes(newWord)) {
    return {
      success: false,
      reason: "WORD_DUPLICATE",
      message: `${errorIcon} Từ này đã được sử dụng`,
    };
  }
  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  const currentLastWord = getSecondPart(enState.currentWord);
 
  if (newWord[0] !== currentLastWord) {
    return {
      success: false,
      reason: "WRONG_START_WORD",
      message: `${errorIcon} Từ cần bắt đầu bằng ${currentLastWord}`,
    };
  }

  // Hợp lệ → cập nhật
  await setWCEnData(guildId, {
    currentWord: newWord,
    wordHistory: [...enState.wordHistory, newWord],
  });

  const nextRequiredWord = getSecondPart(newWord);

  return {
    success: true,
    nextRequiredWord: nextRequiredWord,
    currentWord: newWord,
  };
}

module.exports = {
  getWCEnData,
  setWCEnData,
  gameProcess,
  getSecondPart,
  getRandomWords,
  setLastUser,
  isRepeatPlayer,
  getHint,
  isGameActive,
  stopGame,
  startGame
};
