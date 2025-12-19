const ViWordchain = require("../game/wcViHandler");
const EnWordchain = require("../game/wcEnHandler");
const { checkHintLimit } = require("../utils/hint");

module.exports = {
  name: "hint",
  aliases: ["wc", "ws"],
  description: "Hint nối từ",

  async execute(message, args) {
    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const viState = await ViWordchain.getWCViData(guildId);
    const enState = await EnWordchain.getWCEnData(guildId);
    const userId = message.author.id;    

    if (channelId == viState.channelId) {   
      const hintStatus = await checkHintLimit("wordchain_vi", userId);

      if (!hintStatus.canUse) {
        return message.reply(
          "⚠️ | Bạn đã hết 5 lượt gợi ý miễn phí của ngày hôm nay rồi!"
        );
      }

      const hint = ViWordchain.getHint(viState);
      if (!hint) {
        return message.reply("😅 | Không tìm thấy từ nào hợp lệ để gợi ý!");
      }

      // Tăng số lượt đã dùng
      const remaining = hintStatus.remaining;

      return message.reply({
        content: `💡 | Gợi ý: **||${hint.join(
          ", "
        )}||**\n(Bạn còn **${remaining}/5** lượt dùng hôm nay)`,
        allowedMentions: { repliedUser: false },
      });
    }

    if (channelId == enState.channelId) {     
      const hintStatus = await checkHintLimit("wordchain_en", userId);

      if (!hintStatus.canUse) {
        return message.reply(
          "⚠️ | Bạn đã hết 5 lượt gợi ý miễn phí của ngày hôm nay rồi!"
        );
      }

      const hint = EnWordchain.getHint(enState);
      if (!hint) {
        return message.reply("😅 | Không tìm thấy từ nào hợp lệ để gợi ý!");
      }

      // Tăng số lượt đã dùng
      const remaining = hintStatus.remaining;

      return message.reply({
        content: `💡 | Gợi ý: **||${hint.join(
          ", "
        )}||**\n(Bạn còn **${remaining}/5** lượt dùng hôm nay)`,
        allowedMentions: { repliedUser: false },
      });
    }

    return;
  },
};
