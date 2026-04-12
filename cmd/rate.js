const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon } = require('../utils/icon.js');
const { getIcon } = require('../utils/currency.js');

module.exports = {
  name: "gacha",
  aliases: ["rate"],
  description: "Xem tỉ lệ vật phẩm trong túi mù (Blind Box)",

  async execute(message, args) {
    const itemId = args[0];
    if (!itemId) return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm.`);

    const lootTable = BLIND_BOX_LOOT[itemId];
    const itemInfo = SHOP_ITEMS[itemId];
    if (!lootTable) return message.reply(`${errorIcon} | Vật phẩm này không phải là hộp quà!`);

    const totalWeight = lootTable.reduce((sum, loot) => sum + (loot.weight || 0), 0);
    if (totalWeight <= 0) return message.reply(`${errorIcon} | Lỗi trọng số bằng 0!`);

    // --- LOGIC PHÂN TRANG ---
    const itemsPerPage = 20; // Mỗi trang hiển thị 10 vật phẩm
    const pages = [];
    
    for (let i = 0; i < lootTable.length; i += itemsPerPage) {
      const currentItems = lootTable.slice(i, i + itemsPerPage);
      let pageDescription = "";

      currentItems.forEach(loot => {
        const percentage = ((loot.weight / totalWeight) * 100).toFixed(2);
        const rewardItem = loot.item === 'mora' ? { name: 'Mora', icon: getIcon('mora') } : 
                           loot.item === 'primo' ? { name: 'Primo', icon: getIcon('primo') } : 
                           SHOP_ITEMS[loot.item] || { name: loot.item, icon: "🎁" };

        pageDescription += `${rewardItem.icon} **${rewardItem.name}**: \`${percentage}%\` (x${loot.amount})\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`📊 TỈ LỆ: ${itemInfo ? itemInfo.name.toUpperCase() : itemId}`)
        .setColor(0x00FFFF)
        .setDescription(pageDescription)
        .setFooter({ text: `Trang ${pages.length + 1} / ${Math.ceil(lootTable.length / itemsPerPage)}` });

      pages.push(embed);
    }

    if (pages.length === 1) {
      return message.reply({ embeds: [pages[0]] });
    }

    // --- TẠO NÚT ĐIỀU KHIỂN ---
    let currentPage = 0;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId('next').setLabel('▶️').setStyle(ButtonStyle.Primary)
    );

    const response = await message.reply({ embeds: [pages[currentPage]], components: [row] });

    // --- BỘ THU THẬP TƯƠNG TÁC (COLLECTOR) ---
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 // Hết hạn sau 60 giây
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id) return i.reply({ content: "Nút này không dành cho bạn!", ephemeral: true });

      if (i.customId === 'prev') currentPage--;
      else if (i.customId === 'next') currentPage++;

      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage === pages.length - 1);

      await i.update({ embeds: [pages[currentPage]], components: [row] });
    });

    collector.on('end', () => {
      row.components.forEach(btn => btn.setDisabled(true));
      response.edit({ components: [row] }).catch(() => {});
    });
  },
};