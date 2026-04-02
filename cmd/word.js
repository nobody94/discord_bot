const {
  viDictionary,
  enDictionary,
  saveWord,
  removeWord, 
} = require("../dictionary/dictionary");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "word",
  description: "Quản lý từ điển (Thêm/Xóa từ) - Cú pháp: .word <vi/en> <add/rm> <từ>",

  async execute(message, args) {
    // 1. Kiểm tra quyền: Phải là Dev hoặc Administrator
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isDev && !isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    // 2. Xác định ngôn ngữ, hành động và từ
    // Cú pháp mới: .word <lang> <action> <word>
    const lang = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();
    const newWord = args.slice(2).join(" ").trim().toLowerCase();

    // Kiểm tra ngôn ngữ
    if (!lang || !["vi", "en"].includes(lang)) {
      return message.reply("⚠️ Vui lòng chọn ngôn ngữ: `.word vi ...` hoặc `.word en ...`.");
    }

    // Kiểm tra hành động
    if (!action || !["add", "rm"].includes(action)) {
      return message.reply(`⚠️ Sai cú pháp! Sử dụng: \`.word ${lang} add <từ>\` hoặc \`.word ${lang} rm <từ>\``);
    }

    // Kiểm tra từ
    if (!newWord) {
      return message.reply(`⚠️ Vui lòng nhập từ muốn **${action === "add" ? "thêm" : "xóa"}**.`);
    }

    // 3. Xử lý logic
    const dict = lang === "vi" ? viDictionary : enDictionary;

    try {
      if (action === "add") {
        // Kiểm tra logic Tiếng Việt (phải là cụm 2 từ)
        if (lang === "vi" && newWord.split(/\s+/).length !== 2) {
          return message.reply("⚠️ Từ Tiếng Việt phải là cụm **2 từ**.");
        }
        
        if (dict.includes(newWord)) {
          return message.reply(`⭐ Từ \`${newWord}\` đã tồn tại trong từ điển ${lang.toUpperCase()}.`);
        }

        saveWord(lang, newWord);
        return message.reply(`✅ Đã thêm từ \`${newWord}\` vào từ điển **${lang.toUpperCase()}** thành công!`);

      } else if (action === "rm") {
        if (!dict.includes(newWord)) {
          return message.reply(`❌ Từ \`${newWord}\` không tồn tại trong từ điển ${lang.toUpperCase()} để xóa.`);
        }

        if (typeof removeWord === "function") {
          removeWord(lang, newWord);
          return message.reply(`🗑️ Đã xóa từ \`${newWord}\` khỏi từ điển **${lang.toUpperCase()}**.`);
        } else {
          return message.reply("❌ Hệ thống chưa hỗ trợ hàm xóa từ tự động.");
        }
      }
    } catch (err) {
      console.error(err);
      return message.reply("❌ Lỗi khi thao tác với tệp hệ thống.");
    }
  },
};