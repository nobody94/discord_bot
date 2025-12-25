const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon } = require('../utils/currency.js');
const { SHOP_ITEMS } = require("../utils/shop");
const { errorIcon, verifyIcon, bagIcon } = require('../utils/icon.js')
const { baloHandler } = require('../game/baloHandler.js');

module.exports = {
  name: "balo",
  aliases: ["tui"],
  description: "Xem các vật phẩm bạn đang sở hữu.",

  async execute(message, args) {
    const userId = message.author.id;
    // Lấy danh sách item từ DB (mảng các ID đã mua)
    // Lưu ý: Trong lệnh .buy bạn nên lưu mảng ID;
    const invKey = renderKey("inventory", userId);
    const inventory = (await getKey(invKey)) || [];

    //Xử lý bán, cho, mở đồ
    const isHandled = await baloHandler(args, message, inventory,invKey,userId);

    // Nếu đã thực hiện các lệnh phụ (open, sell, give) thì dừng lại luôn
    if (isHandled) return;

    //LOGIC HIỂN THỊ TÚI ĐỒ
    const embed = new EmbedBuilder()
      .setTitle(
        `${bagIcon} TÚI ĐỒ CỦA ${message.author.username.toUpperCase()}`
      )
      .setColor(0x3498db)
      .setFooter({
        text: "Dùng lệnh .balo give @user <[ID]> <số lượng> để tặng món đồ.\nDùng lệnh .balo sell <[ID]> <số lượng> để bán\nDùng lệnh .balo open <[ID]> <số lượng> để mở",
      });

    if (inventory.length === 0) {
      embed.setDescription("*Túi đồ của bạn đang trống rỗng...*");
    } else {
      // Đếm số lượng từng loại item
      const counts = {};
      inventory.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      const itemList = Object.entries(counts)
        .map(([id, count]) => {
          const item = SHOP_ITEMS[id];
          if (item) {
            return `${item.icon} **${item.name}** x${count} (ID: \`${id}\`)`;
          }
          return `❓ Vật phẩm lạ x${count} (ID: ${id})`;
        })
        .join("\n");

      embed.setDescription(itemList);
    }

    message.reply({ embeds: [embed] });
  },
};
