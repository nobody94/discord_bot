const {
  viDictionary,
  saveWord,
  removeWord,
} = require("../dictionary/dictionary.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "tudien",
  description: "Quản lý từ điển Tiếng Việt - Cú pháp: .tudien <add/rm/list> [từ/trang]",

  async execute(message, args) {
    const isDev = DEVELOPER_IDS.includes(message.author.id);

    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isDev && !isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    const action = args[0]?.toLowerCase();

    // --- XỬ LÝ LỆNH LIST ---
    if (action === "list" || action === "ls") {
      let page = parseInt(args[1]);
      if (isNaN(page) || page < 1) page = 1;

      const pageSize = 20;
      const totalWords = viDictionary.length;
      const totalPages = Math.ceil(totalWords / pageSize);

      if (totalWords === 0) return message.reply("📚 Từ điển Tiếng Việt hiện đang trống.");
      if (page > totalPages) return message.reply(`⚠️ Từ điển chỉ có ${totalPages} trang.`);

      const start = (page - 1) * pageSize;
      const wordsToShow = viDictionary.slice(start, start + pageSize);

      const embed = new EmbedBuilder()
        .setTitle("🇻🇳 DANH SÁCH TỪ ĐIỂN TIẾNG VIỆT")
        .setColor(0x2ecc71)
        .setDescription(wordsToShow.map((word, index) => `**${start + index + 1}.** \`${word}\``).join("\n"))
        .setFooter({ text: `Trang ${page}/${totalPages} | Tổng cộng: ${totalWords} từ` });

      return message.reply({ embeds: [embed] });
    }    

    // --- XỬ LÝ LỆNH ADD (THÊM 1 TỪ) ---
    if (action === "add") {
      const input = args.slice(1).join(" ");
      if (!input) return message.reply("⚠️ Nhập các từ cần xóa, cách nhau bởi dấu phẩy. VD: `.tudien add/rm con gà, con vịt`.");
      const words = input.split(",").map(w => w.trim().toLowerCase()).filter(w => w !== "");

      let successCount = 0;
      let failWords = [];
      let wordLength = 0;

      for (const targetWord of words) {
        if (!viDictionary.includes(targetWord)) {
          if(targetWord.split(/\s+/).length !== 2){
            wordLength++;
          }else if (typeof saveWord === "function") {
            saveWord("vi", targetWord);
            successCount++;
          }
        } else {
          failWords.push(targetWord);
        }
      }

      let response = `📘 Đã thêm thành công **${successCount}** từ.`;
      if(wordLength > 0){
        response += `\n❌ Có ${wordLength} từ không hợp lệ`;
      }
      if (failWords.length > 0) {
        response += `\n❌ Từ này đã có trong từ điển: \`${failWords.join("`, `")}\``;
      }

      return message.reply(response);
    }

    // --- XỬ LÝ LỆNH RM (XÓA NHIỀU TỪ) ---
    if (action === "rm") {
      const input = args.slice(1).join(" ");
      if (!input) return message.reply("⚠️ Nhập các từ cần xóa, cách nhau bởi dấu phẩy. VD: `.tudien add/rm con gà, con vịt`.");
      const words = input.split(",").map(w => w.trim().toLowerCase()).filter(w => w !== "");

      let successCount = 0;
      let failWords = [];

      for (const targetWord of words) {
        if (viDictionary.includes(targetWord)) {
          if (typeof removeWord === "function") {
            removeWord("vi", targetWord);
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

    return message.reply("⚠️ Sử dụng: `.tudien list <trang>`, `.tudien add <từ>`, hoặc `.tudien rm <từ 1>, <từ 2>`");
  },
};