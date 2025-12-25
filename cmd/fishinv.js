const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { FISH_SHOP_ITEMS } = require("../utils/fish.js");
const { fishInvHandler } = require('../game/fishinvHandler.js');

module.exports = {
  name: "fishinv",
  aliases: ["inv", "tuica"],
  description: "Xem đồ nghề câu cá và độ bền của cần.",

  async execute(message, args) {
    const userId = message.author.id;
    const fishInvKey = renderKey("fish_inv", userId);
    const inventory = (await getKey(fishInvKey)) || [];

    // Xử lý tặng/bán qua handler
    const isHandled = await fishInvHandler(args, message, inventory, fishInvKey, userId);
    if (isHandled) return;

    const embed = new EmbedBuilder()
      .setTitle(`🎣 TÚI ĐỒ CÂU CỦA ${message.author.username.toUpperCase()}`)
      .setColor("#3498db")
      .setFooter({ text: "Dùng .fs để xem shop\nDùng .repair <ID> để sửa cần câu\nDùng .inv give @user <ID> <SL> | .inv sell <ID> <SL>" });

    if (inventory.length === 0) {
      embed.setDescription("*Túi đồ của bạn đang trống rỗng...*");
    } else {
      // Nhóm vật phẩm để hiển thị gọn gàng
      const displayLines = [];
      const mồiCounts = {}; // Dành cho vật phẩm dạng String (mồi)
      const cầnList = [];   // Dành cho vật phẩm dạng Object (cần câu)

      inventory.forEach(entry => {
        if (typeof entry === 'object') {
            cầnList.push(entry);
        } else {
            mồiCounts[entry] = (mồiCounts[entry] || 0) + 1;
        }
      });

      // 1. Hiển thị cần câu (từng cái một vì độ bền khác nhau)
      cầnList.forEach(cần => {
        const item = FISH_SHOP_ITEMS[cần.id];
        if (item) {
            displayLines.push(`${item.icon} **${item.name}** [ Độ bền: \`${cần.durability}/${item.maxDurability}\` ] (ID: \`${cần.id}\`)`);
        }
      });

      // 2. Hiển thị mồi (gộp số lượng)
      Object.entries(mồiCounts).forEach(([id, count]) => {
        const item = FISH_SHOP_ITEMS[id];
        if (item) {
            displayLines.push(`${item.icon} **${item.name}** x${count} (ID: \`${id}\`)`);
        } else {
            displayLines.push(`❓ Vật phẩm lạ x${count} (ID: ${id})`);
        }
      });

      embed.setDescription(displayLines.join("\n"));
    }

    message.reply({ embeds: [embed] });
  },
};