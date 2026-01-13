const fs = require("fs");
const path = require('path');

const pathViToFile = path.join(__dirname, '..','dictionary' ,'Viet74K.txt');
const pathEnToFile = path.join(__dirname, '..','dictionary' ,'en-dictionary.json');

const listViWord = new Set(
  fs
    .readFileSync(pathViToFile, "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const rawData =fs.readFileSync(pathEnToFile, "utf8");
const jsonArray = JSON.parse(rawData);  
const sourceArray = Array.isArray(jsonArray) ? jsonArray : Object.keys(jsonArray);
const dicFilter = new Set(sourceArray
            .map((w) => w.trim().toLowerCase())
            .filter((w)=> Boolean(w) && !w.includes('-') && w.length > 1));

const enDictionary = Array.from(dicFilter).map((d)=> d);

const viDictionary = Array.from(listViWord).filter(
  (phrase) => phrase.split(" ").length === 2 && !phrase.includes('-')
);

const saveWord = (lang, word) => {
    const targetWord = word.trim().toLowerCase();
    
    if (lang === 'vi') {
        // Ghi thêm một dòng mới vào file Viet74K.txt
        fs.appendFileSync(pathViToFile, `\n${targetWord}`);
        
        // Cập nhật bộ nhớ tạm để dùng ngay không cần restart
        if (targetWord.split(" ").length === 2) {
            viDictionary.push(targetWord);
        }
    } else {
        // Đọc file JSON hiện tại, thêm từ và ghi đè lại
        const rawData = fs.readFileSync(pathEnToFile, "utf8");
        const jsonArray = JSON.parse(rawData);
        
        if (Array.isArray(jsonArray)) {
            jsonArray.push(targetWord);
            fs.writeFileSync(pathEnToFile, JSON.stringify(jsonArray, null, 2));
            // Cập nhật bộ nhớ tạm
            enDictionary.push(targetWord);
        }
    }
};

module.exports = {
    viDictionary,
    enDictionary,
    saveWord
};