const {
  viDictionary,
  saveWord,
  removeWord,
} = require("../dictionary/dictionary");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "tudien",
  description: "Quản lý từ điển Tiếng Việt - Cú pháp: .tudien <add/rm/list> [từ/trang]",

  async execute(message, args) {
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    if (!isDev) {
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
      const word = args.slice(1).join(" ").trim().toLowerCase();
      if (!word) return message.reply("⚠️ Vui lòng nhập từ muốn thêm.");
      
      if (word.split(/\s+/).length !== 2) {
        return message.reply("⚠️ Từ Tiếng Việt hợp lệ phải có chính xác **2 từ**.");
      }

      if (viDictionary.includes(word)) return message.reply(`⭐ Từ \`${word}\` đã có sẵn.`);

      saveWord("vi", word);
      return message.reply(`✅ Đã lưu từ \`${word}\` vào cơ sở dữ liệu.`);
    }

    // --- XỬ LÝ LỆNH RM (XÓA NHIỀU TỪ) ---
    if (action === "rm") {
      // Lấy danh sách từ sau command, ngăn cách bởi dấu phẩy hoặc khoảng cách nếu bạn muốn
      // Ở đây dùng cách split theo dấu phẩy để hỗ trợ từ ghép có khoảng trắng
      const input = args.slice(1).join(" ");
      if (!input) return message.reply("⚠️ Nhập các từ cần xóa, cách nhau bởi dấu phẩy. VD: `.tudien rm con gà, con vịt`.");

      const wordsToRemove = input.split(",").map(w => w.trim().toLowerCase()).filter(w => w !== "");
      
      let successCount = 0;
      let failWords = [];

      for (const targetWord of wordsToRemove) {
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