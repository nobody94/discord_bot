const {
  enDictionary,
  saveWord,
  removeWord,
} = require("../dictionary/dictionary.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "word",
  description: "Quản lý từ điển Tiếng Anh (Thêm/Xóa từ) - Cú pháp: .word <add/rm> <từ>",

  async execute(message, args) {
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isDev && !isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    // 2. Xác định ngôn ngữ, hành động và từ
    const action = args[0]?.toLowerCase();
    const input = args.slice(1).join(" ");

    if (!action || !["add", "rm"].includes(action)) {
      return message.reply(`⚠️ Sai cú pháp! Sử dụng: \`.word rm/add apple,egg\``);
    }

    if (!input) { return message.reply("⚠️ Nhập các từ cách nhau bởi dấu phẩy. VD: `.word rm/add apple,egg`."); }

    const words = input.split(",").map(w => w.trim().toLowerCase()).filter(w => w !== "");

    // 3. Xử lý logic
    try {
      if (action === "add") {
        let successCount = 0;
        let failWords = [];

        for (const targetWord of words) {
          if (!enDictionary.includes(targetWord)) {
            if (typeof saveWord === "function") {
              saveWord("en", targetWord);
              successCount++;
            }
          } else {
            failWords.push(targetWord);
          }
        }

        let response = `📘 Đã thêm thành công **${successCount}** từ.`;
        if (failWords.length > 0) {
          response += `\n❌ Từ này đã có trong từ điển: \`${failWords.join("`, `")}\``;
        }

        return message.reply(response);
      } else if (action === "rm") {
        let successCount = 0;
        let failWords = [];

        for (const targetWord of words) {
          if (enDictionary.includes(targetWord)) {
            if (typeof removeWord === "function") {
              removeWord("en", targetWord);
              successCount++;
            }
          } else {
            failWords.push(targetWord);
          }
        }
        let response = `🗑️ Đã xóa thành công **${successCount}** từ.`;
        if (failWords.length > 0) {
          response += `\n❌ Không tìm thấy: \`${failWords.join("`, `")}\``;
        }
        return message.reply(response);
      }
    } catch (err) {
      console.error(err);
      return message.reply("❌ Lỗi khi thao tác với tệp hệ thống.");
    }
  },
};