const { enDictionary } = require("../game/dictionary");
const { db, dbKey } = require("../utils/currency");

const dictionary = enDictionary;

async function getGameState(guildId) {
  const key = `${dbKey}_wordchain_en_${guildId}`;
  return (
    (await db.get(key)) || {
      gameActive: false,
      currentWord: null,
      lastUserId: null,
      wordHistory: [],
      channelId: null,
    }
  );
}

async function updateGameState(guildId, data) {
  const state = await getGameState(guildId);
  const key = `${dbKey}_wordchain_en_${guildId}`;
  await db.set(key, { ...state, ...data });
}

function getRandomWords() {
  const words = Array.from(dictionary);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
}

function isValidWord(word) {
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
  return word.slice(-1);
}

function getHint(state) {
  if (!state.gameActive || !state.currentWord) return null;

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
  const state = await getGameState(guildId);
  return state.gameActive;
}

async function startGame(guildId, startingWord) {
  const state = await getGameState(guildId);
  if (state.gameActive) {
    return false;
  }

  await updateGameState(guildId, {
    gameActive: true,
    currentWord: startingWord,
    lastUserId: null,
    wordHistory: [startingWord],
  });

  return true;
}

async function stopGame(guildId) {
  const state = await getGameState(guildId);
  if (!state.gameActive) {
    return 0;
  }

  await updateGameState(guildId, {
    gameActive: false,
    currentWord: null,
    lastUserId: null,
    wordHistory: [],
  });

  const totalWords = state.wordHistory.length;

  return totalWords;
}

async function isRepeatPlayer(guildId, userId) {
  const state = await getGameState(guildId);
  return state.lastUserId === userId; //
}

async function setLastUser(guildId, userId) {
  await updateGameState(guildId, {
    lastUserId: userId,
  });
}

/*Xử lý lượt chơi và kiểm tra luật chơi*/

async function gameProcess(guildId, newWord) {
  const state = await getGameState(guildId);
  if (!state.gameActive)
    return {
      success: false,
      reason: "NOT_ACTIVE",
      message: "Game chưa hoạt động",
    };

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
      message: `❌ Từ này không có trong từ điển`,
    };
  }

  // Lấy tất cả từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = dictionary.filter((p) => {
    if (state.wordHistory.includes(p)) return false;
    return getSecondPart(p) === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    await updateGameState(guildId, {
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
  if (state.wordHistory.includes(newWord)) {
    return {
      success: false,
      reason: "WORD_DUPLICATE",
      message: "❌ Từ này đã được sử dụng",
    };
  }
  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  const currentLastWord = getSecondPart(state.currentWord);
  if (newWord[0] !== currentLastWord) {
    return {
      success: false,
      reason: "WRONG_START_WORD",
      message: `❌ Từ cần bắt đầu bằng ${currentLastWord}`,
    };
  }

  // Hợp lệ → cập nhật
  await updateGameState(guildId, {
    currentWord: newWord,
    wordHistory: [...state.wordHistory, newWord],
  });

  const nextRequiredWord = getSecondPart(newWord);

  return {
    success: true,
    nextRequiredWord: nextRequiredWord,
    currentWord: newWord,
  };
}

module.exports = {
  isGameActive,
  startGame,
  stopGame,
  gameProcess,
  getSecondPart,
  getRandomWords,
  setLastUser,
  isRepeatPlayer,
  getHint,
  getGameState,
  updateGameState,
};
