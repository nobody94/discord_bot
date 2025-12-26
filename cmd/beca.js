const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { FISH_LIST } = require("../utils/fish");
const { becaHandler } = require("../game/becaHandler");
const { getIcon } = require('../utils/currency');

module.exports = {
  name: "beca",
  aliases: ["fishtank", "tank"],
  description: "Xem những con cá bạn hoặc người khác đã câu được.",

  async execute(message, args) {
    // 1. LẤY THÔNG TIN NGƯỜI DÙNG (Tự xem hoặc xem của người được tag)
    const targetUser = message.mentions.users.first() || message.author;
    const userId = targetUser.id;
    const username = targetUser.username;

    const tankKey = renderKey("fishtank", userId);
    let fishTank = (await getKey(tankKey)) || [];

    // 2. CHỈ CHO PHÉP CHỦ SỞ HỮU THỰC HIỆN CÁC LỆNH PHỤ (sell, give...)
    if (message.author.id === userId) {
        const isHandled = await becaHandler(args, message, fishTank, tankKey, userId);
        if (isHandled) return;
    } else if (args[0] && ["sell", "give"].includes(args[0].toLowerCase())) {
        return message.reply("❌ Bạn không thể thao tác trên bể cá của người khác!");
    }

    // 3. HIỂN THỊ EMBED
    const embed = new EmbedBuilder()
      .setTitle(`🐠 BỂ CÁ CỦA ${username.toUpperCase()}`)
      .setColor("#00fbff")
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({
        text: ".beca sell [ID] [SL] | .beca sell all (giữ cá hiếm)\n.beca give @User [ID] [SL] để tặng cá.",
      });

    if (fishTank.length === 0) {
      embed.setDescription(`*Bể cá của ${username} đang trống rỗng... 🎣*`);
    } else {
      const counts = {};
      fishTank.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      const fishDisplay = Object.entries(counts)
        .map(([id, count]) => {
          const fish = FISH_LIST[id];
          if (fish) {
            return `${fish.icon} **${fish.name}** x${count} (ID: \`${id}\`) - Giá: \`${fish.sellPrice}\`${getIcon(fish.currency)}`;
          }
          return `❓ Sinh vật lạ x${count} (ID: ${id})`;
        })
        .join("\n");

      embed.setDescription(fishDisplay);
    }

    message.reply({ embeds: [embed] });
  },
};