const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { FISH_LIST } = require("../utils/fish");
const { becaHandler } = require("../game/becaHandler");
const {getIcon} = require('../utils/currency');

module.exports = {
  name: "beca",
  aliases: ["fishtank", "tank"],
  description: "Xem những con cá bạn đã câu được.",

  async execute(message, args) {
    const userId = message.author.id;
    const tankKey = renderKey("fishtank", userId);
    let fishTank = (await getKey(tankKey)) || [];

    // Xử lý các lệnh phụ (sell)
    const isHandled = await becaHandler(args, message, fishTank, tankKey, userId);
    if (isHandled) return;

    const embed = new EmbedBuilder()
      .setTitle(`🐠 BỂ CÁ CỦA ${message.author.username.toUpperCase()}`)
      .setColor("#00fbff")
      .setFooter({
        text: ".beca sell [ID] [SL] | .beca sell all (giữ cá hiếm)\n.beca give @User [ID] [SL] để tặng cá.",
      });

    if (fishTank.length === 0) {
      embed.setDescription("*Bể cá trống rỗng... Hãy đi câu cá để có thêm cá trong bể! 🎣*");
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