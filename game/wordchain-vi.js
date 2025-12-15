const getDic = require("../game/dictionary");

const dictionary = getDic.viDictionary;
let gameActive = false;
let currentWord = null;
const wordHistory = new Set();

//lấy 2 từ ngẫu nhiên
function getRandomWords() {
  const words = Array.from(dictionary);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
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
  wordHistory.clear();

  //Từ ngẫu nhiên khi bắt đầu game
  const firstPhrase = startingWord;
  //   const [firstWordPhase, secondWordPhase] = firstPhrase.split(" ");
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
  wordHistory.clear();

  return totalWords;
}

/*Xử lý lượt chơi và kiểm tra luật chơi*/

function gameProcess(newWord) {
  if (!gameActive) return { success: false, reason: "NOT_ACTIVE" ,message:"Game chưa hoạt động"};
  const parts = newWord.split(/\s+/);
  const [firstWord, secondWord] = parts;
  // check độ dài
  if (parts.length < 2) {
    return { success: false, reason: "WORD_TOO_SHORT",message:"❌ Từ phải là cụm 2 từ" };
  }
  // Lấy tất cả cụm 2 từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = dictionary.filter((p) => {
    if (wordHistory.has(p)) return false;
    return p.split(" ")[0] === secondWord;
  });

  //hết từ nối
  if (nextOptions.length === 0) {
    gameActive = false;
    currentWord = null;
    wordHistory.clear();

    return { success: false, reason: "OUT_OF_WORD",message:"Hết từ để nối tiếp" };
  }

  // Kiểm tra hợp lệ theo từ điển
  if (!isValidWord(newWord)) {
    return { success: false, reason: "WORD_NOT_VALID" ,message:`❌ Từ này không có trong từ điển`};
  }
  // Không lặp cụm
  if (wordHistory.has(newWord)) {
    return { success: false, reason: "WORD_DUPLICATE" ,message:"❌ Từ này đã được sử dụng"};
  }
  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  const  currentLastWord = getSecondPart(currentWord);
  if (firstWord !== currentLastWord) {
    return { success: false, reason: "WRONG_START_WORD" ,message:`❌ Từ cần bắt đầu bằng ${currentLastWord}`};
  }

  // Hợp lệ → cập nhật
  wordHistory.add(content);
  currentWord = newWord;
  const nextRequiredWord = getSecondPart(newWord);
  return {
    success:true,
    nextRequiredWord:nextRequiredWord,
    currentWord:currentWord
  }
}

module.exports={
    isGameActive,
    getCurrentWord,
    startGame,
    stopGame,
    gameProcess,
    getSecondPart,
    getRandomWords
}