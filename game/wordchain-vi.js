const getDic = require("../game/dictionary");
const { db, dbKey } = require("../utils/currency");

const dictionary = getDic.viDictionary;

async function getGameState(guildId) {
  const key = `${dbKey}_wordchain_vi_${guildId}`;
  return (
    (await db.get(key)) || {
      gameActive: false,
      currentWord: null,
      lastUserId: null,
      wordHistory: [],
      channelId:null
    }
  );
}

async function updateGameState(guildId, data) {
  const state = await getGameState(guildId);
  const key = `${dbKey}_wordchain_vi_${guildId}`;
  await db.set(key, {...state,...data});
}

//lấy 2 từ ngẫu nhiên
function getRandomWords() { 
  const words = Array.from(dictionary);
  let startingWord = "";
  let isValid = false;

  // Lặp để tìm từ phù hợp
  while (!isValid) {
    // Lấy 1 từ ngẫu nhiên từ danh sách
    startingWord = words[Math.floor(Math.random() * words.length)];

    // Lấy phần cuối của từ này (ví dụ: "nối từ" -> lấy "từ")
    const secondPart = this.getSecondPart(startingWord);

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

  const secondPart = getSecondPart(state.currentWord).toLowerCase();

  const matches = Array.from(dictionary).filter((word) => {
    const wLower = word.toLowerCase();
    return wLower.startsWith(secondPart + " ") && !state.wordHistory.includes(wLower);
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

async function startGame(guildId,startingWord) {
  const state = await getGameState(guildId);
  if (state.gameActive) return false;

  //Từ ngẫu nhiên khi bắt đầu game
  await updateGameState(guildId, {
    gameActive: true,
    currentWord: startingWord,
    lastUserId: null,
    wordHistory: [startingWord], // Lưu mảng vì DB không hỗ trợ Set trực tiếp
  });
  return true;
}

async function stopGame(guildId) { 
  const state = await getGameState(guildId); 
  // console.log(state);
  if (!state.gameActive) {
    return 0;
  }
  await updateGameState(guildId, {
    gameActive: false,
    currentWord: null,
    lastUserId: null,
    wordHistory: [], // Lưu mảng vì DB không hỗ trợ Set trực tiếp
  });
  
  const totalWords = state.wordHistory.length;  

  return totalWords;
}

async function isRepeatPlayer(guildId,userId) {
  const state = await getGameState(guildId);
  return state.lastUserId === userId; //
}

async function setLastUser(guildId,userId) { 
  await updateGameState(guildId, {   
    lastUserId: userId   
  });
}

/*Xử lý lượt chơi và kiểm tra luật chơi*/

async function gameProcess(guildId, newWord) {
  const state = await getGameState(guildId);

  if (!state.gameActive) {
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
      message: "❌ Từ phải là cụm 2 từ",
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
    if (state.wordHistory.includes(p)) return false;
    return p.split(" ")[0] === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    await updateGameState(guildId, {
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
      message: `❌ Từ này không có trong từ điển`,
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
  if (firstWord !== currentLastWord) {
    return {
      success: false,
      reason: "WRONG_START_WORD",
      message: `❌ Từ cần bắt đầu bằng ${currentLastWord}`,
    };
  }

  // Hợp lệ → cập nhật
  await updateGameState(guildId, {  
    currentWord: newWord,    
    wordHistory: [...state.wordHistory,newWord], 
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
  updateGameState
};
