const { EmbedBuilder } = require("discord.js");
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon } = require('../utils/icon.js');

module.exports = {
  name: "gacha",
  aliases: ["rate"],
  description: "Xem tỉ lệ vật phẩm trong túi mù (Blind Box)",

  async execute(message, args) {
    const itemId = args[0];

    // 1. Kiểm tra nếu người dùng không nhập ID
    if (!itemId) {
      return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm để xem tỉ lệ. Ví dụ: \`.gacha tui_mu_01\``);
    }

    // 2. Lấy dữ liệu loot table từ utils/shop.js
    const lootTable = BLIND_BOX_LOOT[itemId];
    const itemInfo = SHOP_ITEMS[itemId];

    if (!lootTable) {
      return message.reply(`${errorIcon} | Vật phẩm này không có tỉ lệ hoặc không phải là hộp quà!`);
    }

    // 3. Tính tổng trọng số (Weight)
    const totalWeight = lootTable.reduce((sum, loot) => sum + (loot.weight || 0), 0);

    if (totalWeight <= 0) {
      return message.reply(`${errorIcon} | Lỗi: Tổng trọng số quà tặng bằng 0. Vui lòng báo Admin!`);
    }

    // 4. Tạo mô tả tỉ lệ phần trăm
    let rateDescription = "";
    lootTable.forEach(loot => {
      const percentage = ((loot.weight / totalWeight) * 100).toFixed(2);
      const rewardItem = SHOP_ITEMS[loot.item] || { name: loot.item, icon: "🎁" };
      
      rateDescription += `${rewardItem.icon} **${rewardItem.name}**: \`${percentage}%\` (Số lượng: ${loot.amount})\n`;
    });

    // 5. Gửi Embed
    const embed = new EmbedBuilder()
      .setTitle(`📊 TỈ LỆ VẬT PHẨM: ${itemInfo ? itemInfo.name.toUpperCase() : itemId}`)
      .setColor(0x00FFFF)
      .setThumbnail(itemInfo ? (itemInfo.image || null) : null)
      .setDescription(rateDescription)
      .addFields({ 
        name: "Hướng dẫn", 
        value: `Dùng lệnh \`.balo open ${itemId}\` để mở.` 
      })
      .setFooter({ text: `Tổng trọng số: ${totalWeight}` });

    return message.reply({ embeds: [embed] });
  },
};