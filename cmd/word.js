const {
  viDictionary,
  enDictionary,
  saveWord,
  removeWord, 
} = require("../dictionary/dictionary");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField } = require("discord.js");
const ViWordchain = require("../game/wcViHandler");
const EnWordchain = require("../game/wcEnHandler");

module.exports = {
  name: "word",
  description: "Quản lý từ điển (Thêm/Xóa từ) - Chỉ dành cho Admin/Dev",

  async execute(message, args) {
    // 1. Kiểm tra quyền: Phải là Dev hoặc Administrator
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isDev && !isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
    }

    // 2. Xác định hành động (add/rm) và từ cần xử lý
    const action = args[0]?.toLowerCase();
    const newWord = args.slice(1).join(" ").trim().toLowerCase();

    if (!action || !["add", "rm"].includes(action)) {
      return message.reply("⚠️ Vui lòng sử dụng đúng cú pháp: `.word add <từ>` hoặc `.word rm <từ>`");
    }

    if (!newWord) {
      return message.reply(`⚠️ Vui lòng nhập từ muốn **${action === "add" ? "thêm" : "xóa"}**.`);
    }

    // 3. Xác định ngôn ngữ dựa trên kênh hiện tại
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    const viState = await ViWordchain.getWCViData(guildId);
    const enState = await EnWordchain.getWCEnData(guildId);

    let lang = null;
    if (channelId === viState.channelId) {
      lang = "vi";
    } else if (channelId === enState.channelId) {
      lang = "en";
    }

    if (!lang) {
      return message.reply("❌ Lệnh này chỉ có thể thực hiện trong các kênh chơi Nối Từ.");
    }

    // 4. Xử lý logic
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

        // Gọi hàm xóa từ (Bạn cần đảm bảo file dictionary có hàm này)
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