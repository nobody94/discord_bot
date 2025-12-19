const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");

module.exports = {
  name: "balo",
  aliases: ["tui", "inventory", "inv"],
  description: "Xem các vật phẩm bạn đang sở hữu.",

  async execute(message, args) {
    const userId = message.author.id;
    // Lấy danh sách item từ DB (mảng các ID đã mua)
    // Lưu ý: Trong lệnh .buy bạn nên lưu mảng ID;
    const invKey = renderKey("inventory", userId);
    const inventory = (await getKey(invKey)) || [];

    // --- LOGIC TẶNG ĐỒ (GIVE) ---
    if (args[0] === "give") {
      const target = message.mentions.users.first();
      const itemId = args[2];

      if (!target)
        return message.reply(
          "❌ | Vui lòng tag người muốn tặng: `.balo give @user [ID_vật_phẩm]`"
        );
      if (target.id === userId)
        return message.reply("❌ | Bạn không thể tự tặng đồ cho chính mình.");
      if (!itemId)
        return message.reply("❌ | Vui lòng nhập ID vật phẩm muốn tặng.");

      // Kiểm tra vật phẩm có trong túi đồ không
      const itemIndex = inventory.indexOf(itemId);
      if (itemIndex === -1) {
        return message.reply(
          `❌ | Bạn không sở hữu vật phẩm có ID \`${itemId}\` trong túi đồ.`
        );
      }

      // Thực hiện chuyển đồ
      const targetInvKey = renderKey("inventory", target.id);
      let targetInventory = (await getKey(targetInvKey)) || [];

      // Xóa 1 món từ người tặng và thêm vào người nhận
      inventory.splice(itemIndex, 1);
      targetInventory.push(itemId);

      // Cập nhật lại Database cho cả 2 người
      await setKey(invKey, inventory);
      await setKey(targetInvKey, targetInventory);

      const item = SHOP_ITEMS[itemId] || {
        name: itemId,
        icon: "<:box:1451465056612253779>",
      };
      return message.reply(
        `✅ | Bạn đã tặng **${item.icon} ${item.name}** cho **${target.username}** thành công!`
      );
    }

    //LOGIC HIỂN THỊ TÚI ĐỒ
    const embed = new EmbedBuilder()
      .setTitle(
        `<:bag:1451465027252125738> TÚI ĐỒ CỦA ${message.author.username.toUpperCase()}`
      )
      .setColor(0x3498db)
      .setFooter({
        text: "Dùng lệnh .balo give @user <[ID]> để tặng món đồ",
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
