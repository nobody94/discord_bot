const { renderKey, getKey, setKey } = require("../utils/db");
const { viDictionary } = require("../dictionary/dictionary");
const {errorIcon} = require('../utils/icon');

async function getWCViData(guildId) {
  const dbKey = renderKey("wordchain_vi", guildId);
  return (
    (await getKey(dbKey)) || {
      gameActive: false,
      currentWord: null,
      lastUserId: null,
      wordHistory: [],
      channelId: null,
    }
  );
}

async function setWCViData(guildId, data) {
  const dbKey = renderKey("wordchain_vi", guildId);
  const currentData = await getWCViData(guildId);
  return await setKey(dbKey, { ...currentData, ...data });
}

//lấy 2 từ ngẫu nhiên
function getRandomWords() {
  const dictionary = viDictionary;
  const words = Array.from(dictionary);
  let startingWord = "";
  let isValid = false;

  // Lặp để tìm từ phù hợp
  while (!isValid) {
    // Lấy 1 từ ngẫu nhiên từ danh sách
    startingWord = words[Math.floor(Math.random() * words.length)];

    // Lấy phần cuối của từ này (ví dụ: "nối từ" -> lấy "từ")
    const secondPart = getSecondPart(startingWord);

    // Kiểm tra xem có từ nào trong dictionary bắt đầu bằng 'secondPart' không
    // Giả sử bạn có hàm check từ bắt đầu hoặc duyệt mảng
    const canBeFollowed = words.some((word) =>
      word.startsWith(secondPart + " ")
    );

    if (canBeFollowed) {
      isValid = true;
    }
  }

  return startingWord;
}

function isValidWord(word) {
  const dictionary = viDictionary;
  return dictionary.includes(word.toLowerCase());
}

function getSecondPart(word) {
  const parts = word.split(/\s+/);
  // Nếu có 2 từ trở lên, trả về từ thứ hai (index 1)
  if (parts.length >= 2) {
    return parts[1];
  }
  // Nếu chỉ có 1 từ, trả về từ đó (trường hợp từ bắt đầu game)
  return parts[0];
}

function getHint(state) {  
  if (!state.gameActive || !state.currentWord) return null;
  
  const dictionary = viDictionary;
  const secondPart = getSecondPart(state.currentWord).toLowerCase();

  const matches = Array.from(dictionary).filter((word) => {
    const wLower = word.toLowerCase();
    return (
      wLower.startsWith(secondPart + " ") && !state.wordHistory.includes(wLower)
    );
  });

  if (matches.length === 0) return null;

  // Trộn ngẫu nhiên danh sách kết quả
  const shuffled = matches.sort(() => 0.5 - Math.random());

  // Lấy tối đa 3 từ
  return shuffled.slice(0, 3);
}

async function isGameActive(guildId) {
  const state = await getWCViData(guildId);
  return state.gameActive;
}

async function startGame(guildId, startingWord) {
  const state = await getWCViData(guildId);

  if (state.gameActive) return false;

  //Từ ngẫu nhiên khi bắt đầu game
  await setWCViData(guildId, {
    gameActive: true,
    currentWord: startingWord,
    lastUserId: null,
    wordHistory: [startingWord], // Lưu mảng vì DB không hỗ trợ Set trực tiếp
  });
  return true;
}

async function stopGame(guildId) {
  const state = await getWCViData(guildId);
  if (!state.gameActive) {
    return 0;
  }
  await setWCViData(guildId, {
    gameActive: false,
    currentWord: null,
    lastUserId: null,
    wordHistory: [], // Lưu mảng vì DB không hỗ trợ Set trực tiếp
  });

  const totalWords = state.wordHistory.length;

  return totalWords;
}

async function isRepeatPlayer(guildId, userId) {
  const state = await getWCViData(guildId);
   if (!state || !state.lastUserId) return false;
  return state.lastUserId === userId;
}

async function setLastUser(guildId, userId) {
  await setWCViData(guildId, {
    lastUserId: userId,
  });
}

async function gameProcess(guildId,newWord) {
  // 1. Lấy cấu hình từ DB 
  const viState = await getWCViData(guildId);
  const dictionary = viDictionary;
  if (!viState.gameActive) {
    return {
      success: false,
      reason: "NOT_ACTIVE",
      message: "Game chưa hoạt động",
    };
  }
  const parts = newWord.split(/\s+/);
  const [firstWord, secondWord] = parts;
  // check độ dài
  if (parts.length < 2) {
    return {
      success: false,
      reason: "WORD_TOO_SHORT",
      message: `${errorIcon} Từ phải là cụm 2 từ`,
    };
  }
  if (parts.length > 2) {
    return {
      success: false,
      reason: "LENGTH_OVER",
      message: "",
    };
  }
  // Lấy tất cả cụm 2 từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = dictionary.filter((p) => {
    if (viState.wordHistory.includes(p)) return false;
    return p.split(" ")[0] === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    await setWCViData(guildId, {
      gameActive: true,
      currentWord: startingWord,
      lastUserId: null,
      wordHistory: [],
    });

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
      message: `${errorIcon} Từ này không có trong từ điển`,
    };
  }
  // Không lặp cụm
  if (viState.wordHistory.includes(newWord)) {
    return {
      success: false,
      reason: "WORD_DUPLICATE",
      message: `${errorIcon} Từ này đã được sử dụng`,
    };
  }
  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  const currentLastWord = getSecondPart(viState.currentWord);
  if (firstWord !== currentLastWord) {
    return {
      success: false,
      reason: "WRONG_START_WORD",
      message: `${errorIcon} Từ cần bắt đầu bằng ${currentLastWord}`,
    };
  }

  // Hợp lệ → cập nhật
  await setWCViData(guildId, {
    currentWord: newWord,
    wordHistory: [...viState.wordHistory, newWord],
  });

  const nextRequiredWord = getSecondPart(newWord);

  return {
    success: true,
    nextRequiredWord: nextRequiredWord,
    currentWord: newWord,
  };
}

module.exports = {
  getWCViData,
  setWCViData,
  getRandomWords,
  gameProcess,
  isRepeatPlayer,
  setLastUser,
  stopGame,
  startGame,
  getHint,
  isGameActive,
  getSecondPart
};
