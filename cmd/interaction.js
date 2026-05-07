const { EmbedBuilder } = require("discord.js");
const {
  getCustomDate,
  MAX_LOVE_POINTS_PER_DAY,
} = require("../utils/constant.js");
const { setKey, getKey, renderKey } = require("../utils/db");
const {interactions} = require('../utils/interaction.js');

module.exports = {
  name: "interaction",
  aliases: Object.keys(interactions),
  async execute(message, args, commandName) {
    // commandName là tên lệnh người dùng nhập (ví dụ: pat, poke...)
    const config = interactions[commandName];
    if (!config) return;

    const target = message.mentions.users.first();
    if (!target) return message.reply(`Bạn phải tag ai đó để ${config.msg}!`);

    let gifUrl = config.images[Math.floor(Math.random() * config.images.length)];

    // --- LOGIC THÂN MẬT ---
    let loveNote = "";
    const guildId = message.guild.id;
    const userId = message.author.id;
    const coupleKey = renderKey("couple", guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    const coupleIndex = couplesList.findIndex(
      (c) => c.husband === userId || c.wife === userId
    );

    if (coupleIndex !== -1) {
      const today = getCustomDate();
      const couple = couplesList[coupleIndex];
      const partnerId = couple.husband === userId ? couple.wife : couple.husband;

      // Reset điểm ngày nếu qua 4h sáng
      if (couple.lastGiftDate !== today) {
        couplesList[coupleIndex].lastGiftDate = today;
        couplesList[coupleIndex].dailyLovePoints = 0;
      }

      const points = config.lovePoint || 0;
      const currentDaily = couplesList[coupleIndex].dailyLovePoints || 0;

      if (target.id === partnerId) {
        if (points < 0) {
          // Hành động tiêu cực: Luôn trừ điểm
          couple.lovePoints =
            (couple.lovePoints || 0) + points;
          loveNote = `\n💔 Thân mật: **${points}** (Đừng bạo lực thế chứ!)`;
        } else {
          // Hành động tích cực: Kiểm tra giới hạn ngày
          const remaining = MAX_LOVE_POINTS_PER_DAY - currentDaily;
          if (remaining > 0) {
            const added = Math.min(points, remaining);
            couple.lovePoints =
              (couple.lovePoints || 0) + added;
            couple.dailyLovePoints = currentDaily + added;
            loveNote = `\n💖 Thân mật: **+${added}** điểm!`;
          }
        }
      }
      else if (points > 2 && target.id !== userId) {
        couple.lovePoints = (couple.lovePoints || 0) - points;
        loveNote = `\n🔥 **Bắt quả tang!** Bạn dám ${config.msg} người khác sao? \n💔 Bạn đời của bạn đã buồn và hai bạn bị trừ **${points}** điểm thân mật!`;
      }

      await setKey(coupleKey, couplesList);
    }
    // --- KẾT THÚC LOGIC THÂN MẬT ---

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription(
        `**${message.author.username}** ${config.msg} **${target.username}**!${loveNote}`
      )
      .setImage(gifUrl);

    message.reply({ embeds: [embed] });
  },
};
