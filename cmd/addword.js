const {
  viDictionary,
  enDictionary,
  saveWord,
} = require("../dictionary/dictionary");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { PermissionsBitField } = require("discord.js");
const ViWordchain = require("../game/wcViHandler");
const EnWordchain = require("../game/wcEnHandler");

module.exports = {
  name: "addword",
  description: "Thêm từ mới vào từ điển (Chỉ dành cho Admin/Dev)",

  async execute(message, args) {
    // Kiểm tra quyền: Phải là Dev hoặc có quyền Quản lý kênh
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    );

    if (!isDev && !isAdmin) {
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
    }
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
      return; 
    }

    // 3. Lấy từ cần thêm
    const newWord = args.join(" ").trim().toLowerCase();
    if (!newWord) {
      return message.reply(
        `⚠️ Vui lòng nhập từ cần thêm. Ví dụ: \`.addword ${
          lang === "vi" ? "học tập" : "apple"
        }\``
      );
    }

    // 4. Kiểm tra logic theo ngôn ngữ của kênh
    if (lang === "vi") {
      if (newWord.split(/\s+/).length !== 2) {
        return message.reply("⚠️ Từ Tiếng Việt phải là cụm **2 từ**.");
      }
      if (viDictionary.includes(newWord)) {
        return message.reply("⭐ Từ này đã tồn tại trong từ điển Tiếng Việt.");
      }
    } else {
      if (enDictionary.includes(newWord)) {
        return message.reply("⭐ Từ này đã tồn tại trong từ điển Tiếng Anh.");
      }
    }

    // 5. Lưu từ
    try {
      saveWord(lang, newWord);
      return message.reply(
        `✅ Đã thêm từ **${newWord}** vào từ điển **${lang.toUpperCase()}** thành công!`
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ Lỗi khi lưu vào file hệ thống.");
    }
  },
};
