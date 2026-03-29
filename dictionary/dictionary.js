const fs = require("fs");
const path = require('path');

const pathViToFile = path.join(__dirname, '..','dictionary' ,'vi-dictionary.txt');
// Đổi đuôi file thành .txt
const pathEnToFile = path.join(__dirname, '..','dictionary' ,'en-dictionary.txt');

// Xử lý từ điển Tiếng Việt
const listViWord = new Set(
  fs
    .readFileSync(pathViToFile, "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

// Xử lý từ điển Tiếng Anh (Chuyển từ JSON sang TXT)
const rawEnData = fs.readFileSync(pathEnToFile, "utf8");
const enLines = rawEnData.split("\n"); // Tách theo dòng thay vì parse JSON

const dicFilter = new Set(
  enLines
    .map((w) => w.trim().toLowerCase())
    .filter((w) => Boolean(w) && !w.includes('-') && w.length > 1)
);

const enDictionary = Array.from(dicFilter);

const viDictionary = Array.from(listViWord).filter(
  (phrase) => phrase.split(" ").length === 2 && !phrase.includes('-')
);

const saveWord = (lang, word) => {
    const targetWord = word.trim().toLowerCase();
    
    if (lang === 'vi') {
        fs.appendFileSync(pathViToFile, `\n${targetWord}`);
        if (targetWord.split(" ").length === 2) {
            viDictionary.push(targetWord);
        }
    } else {
        // Ghi vào file .txt tiếng Anh (Dùng append để tối ưu hơn ghi đè)
        fs.appendFileSync(pathEnToFile, `\n${targetWord}`);
        
        // Cập nhật bộ nhớ tạm
        if (!enDictionary.includes(targetWord) && !targetWord.includes('-')) {
            enDictionary.push(targetWord);
        }
    }
};

module.exports = {
    viDictionary,
    enDictionary,
    saveWord
};