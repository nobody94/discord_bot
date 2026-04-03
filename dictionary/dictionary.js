const fs = require("fs");
const path = require('path');

// Đường dẫn tới các file .txt
const pathViToFile = path.join(__dirname, '..', 'dictionary', 'vi-dictionary.txt');
const pathEnToFile = path.join(__dirname, '..', 'dictionary', 'en-dictionary.txt');

// --- HÀM HỖ TRỢ ĐỌC VÀ LỌC FILE ---
const loadDictionary = (filePath, isVietnamese = false) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        
        const rawData = fs.readFileSync(filePath, "utf8");
        return rawData
            .split("\n")
            .map((w) => w.trim().toLowerCase())
            .filter((word) => {
                const isValid = Boolean(word) && !word.includes('-');
                
                if (isVietnamese) {
                    // Tiếng Việt: Phải là cụm 2 từ (cho game nối chữ)
                    return isValid && word.split(/\s+/).length === 2;
                } else {
                    // Tiếng Anh: Loại bỏ từ 1 chữ cái và từ chuyên ngành khó (có thể lọc thêm ở đây)
                    return isValid && word.length > 1;
                }
            });
    } catch (err) {
        console.error(`[Dictionary] Lỗi khi load file ${filePath}:`, err);
        return [];
    }
};

// --- KHỞI TẠO BỘ NHỚ TẠM (ARRAY) ---
// Sử dụng Set để loại bỏ trùng lặp ngay từ lúc load file
let viDictionary = Array.from(new Set(loadDictionary(pathViToFile, true)));
let enDictionary = Array.from(new Set(loadDictionary(pathEnToFile, false)));

const saveWord = (lang, word) => {
    const targetWord = word.trim().toLowerCase();
    const isVi = lang === 'vi';
    const filePath = isVi ? pathViToFile : pathEnToFile;
    const dictionary = isVi ? viDictionary : enDictionary;

    // Kiểm tra điều kiện trước khi lưu
    if (targetWord.includes('-') || targetWord.length <= 1) return;
    if (isVi && targetWord.split(/\s+/).length !== 2) return;
    
    // Nếu từ chưa tồn tại trong bộ nhớ tạm
    if (!dictionary.includes(targetWord)) {
        // 1. Cập nhật file vật lý (Dùng append để tối ưu tốc độ)
        fs.appendFileSync(filePath, `\n${targetWord}`, "utf8");
        
        // 2. Cập nhật bộ nhớ tạm
        dictionary.push(targetWord);
        console.log(`[Dictionary] Đã thêm từ mới: "${targetWord}" vào ${lang}`);
    }
};

const removeWord = (lang, word) => {
    const targetWord = word.trim().toLowerCase();
    const isVi = lang === 'vi';
    const filePath = isVi ? pathViToFile : pathEnToFile;
    
    // Lấy reference tới mảng đúng để xóa trong bộ nhớ tạm
    let dictionary = isVi ? viDictionary : enDictionary;

    // 1. Xóa khỏi bộ nhớ tạm
    const index = dictionary.indexOf(targetWord);
    if (index !== -1) {
        dictionary.splice(index, 1);
    }

    // 2. Cập nhật lại file vật lý (Ghi đè hoàn toàn để sạch dữ liệu)
    try {
        const data = fs.readFileSync(filePath, "utf8");
        const remainingWords = data
            .split("\n")
            .map(w => w.trim().toLowerCase())
            .filter(w => Boolean(w) && w !== targetWord);

        fs.writeFileSync(filePath, remainingWords.join("\n"), "utf8");
        console.log(`[Dictionary] Đã xóa từ "${targetWord}" khỏi file ${lang}`);
    } catch (err) {
        console.error(`[Dictionary] Lỗi khi ghi file sau khi xóa:`, err);
    }
};

module.exports = {
    viDictionary,
    enDictionary,
    saveWord,
    removeWord
};