const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon } = require("../utils/currency.js");
const { SHOP_ITEMS } = require("../utils/shop");
const { errorIcon, verifyIcon, bagIcon } = require("../utils/icon.js");

module.exports = {
  name: "tudo",
  description: "Xem tủ đồ cá nhân với tính năng phân trang bằng nút bấm.",

  async execute(message, args) {
    // --- CẤU HÌNH GIỚI HẠN ---
    const allowedChannels = ["1447195483637420165"];
    const allowedUsers = [
      "1446889473374683400",
      "1016709206780411924",
      "1308643245018054716",
      "1302095613609115689",
    ];

    if (!allowedChannels.includes(message.channel.id)) return;
    if (!allowedUsers.includes(message.author.id)) return;

    const senderId = message.author.id;
    const senderTudoKey = renderKey("tudo", senderId);
    let senderTudo = (await getKey(senderTudoKey)) || [];

    // --- LOGIC LẤY ĐỒ RA BAO LÔ (LAY/TAKE) ---
    if (args[0] === "lay" || args[0] === "take") {
      const itemId = args[1];
      const amountToTake = parseInt(args[2]) || 1;

      if (!itemId) return message.reply(`${errorIcon} | HD: \`.tudo lay [ID] [SL]\``);
      if (isNaN(amountToTake) || amountToTake <= 0) return message.reply(`${errorIcon} | SL không hợp lệ.`);

      const itemInTudo = senderTudo.filter((id) => id === itemId);
      if (itemInTudo.length < amountToTake) {
        return message.reply(`${errorIcon} | Bạn không đủ **${itemId}** (Hiện có: ${itemInTudo.length}).`);
      }

      const baloKey = renderKey("inventory", senderId);
      let baloInventory = (await getKey(baloKey)) || [];

      for (let i = 0; i < amountToTake; i++) {
        const index = senderTudo.indexOf(itemId);
        if (index !== -1) {
          senderTudo.splice(index, 1);
          baloInventory.push(itemId);
        }
      }

      await setKey(senderTudoKey, senderTudo);
      await setKey(baloKey, baloInventory);

      const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
      return message.reply(`${verifyIcon} | Đã lấy **${amountToTake}x ${itemInfo.icon} ${itemInfo.name}** vào bao lô.`);
    }

    // --- LOGIC TẶNG ĐỒ (GIVE) ---
    if (args[0] === "give") {
      const target = message.mentions.users.first();
      const itemId = args[2];
      const amountToGive = parseInt(args[3]) || 1;

      if (!target || target.id === senderId || !itemId || isNaN(amountToGive) || amountToGive <= 0) {
        return message.reply(`${errorIcon} | Sai cú pháp hoặc đối tượng!`);
      }

      const userItems = senderTudo.filter((id) => id === itemId);
      if (userItems.length < amountToGive) return message.reply(`${errorIcon} | Không đủ đồ để tặng.`);

      const targetInvKey = renderKey("tudo", target.id);
      let targetInventory = (await getKey(targetInvKey)) || [];

      for (let i = 0; i < amountToGive; i++) {
        const index = senderTudo.indexOf(itemId);
        if (index !== -1) {
          senderTudo.splice(index, 1);
          targetInventory.push(itemId);
        }
      }

      await setKey(senderTudoKey, senderTudo);
      await setKey(targetInvKey, targetInventory);

      const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
      return message.reply(`${verifyIcon} | Đã tặng **${amountToGive}x ${itemInfo.icon} ${itemInfo.name}** cho **${target.username}**.`);
    }

    // --- HIỂN THỊ TỦ ĐỒ PHÂN TRANG ---
    const viewTarget = message.mentions.users.first() || message.author;
    const viewKey = renderKey("tudo", viewTarget.id);
    const viewInventory = viewTarget.id === senderId ? senderTudo : (await getKey(viewKey)) || [];

    if (viewInventory.length === 0) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xe74c3c).setDescription(`${bagIcon} Tủ đồ của **${viewTarget.username}** trống.`)] });
    }

    const counts = {};
    viewInventory.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });

    const sortedItems = Object.entries(counts)
      .map(([id, count]) => {
        const item = SHOP_ITEMS[id] || { name: "Vật phẩm lạ", icon: "❓", id: id };
        return { ...item, count, originalId: id };
      })
      .sort((a, b) => a.originalId.localeCompare(b.originalId, undefined, { numeric: true, sensitivity: 'base' }));

    // Chia danh sách (ví dụ: 10 vật phẩm mỗi trang)
    const itemsPerPage = 20;
    const pages = [];
    for (let i = 0; i < sortedItems.length; i += itemsPerPage) {
      const current = sortedItems.slice(i, i + itemsPerPage);
      const description = current.map((item, index) => 
        `**${i + index + 1}.** ${item.icon} **${item.name}** x${item.count} (ID: \`${item.originalId}\`)`
      ).join("\n");
      pages.push(description);
    }

    let currentPage = 0;

    const generateEmbed = (pageIdx) => {
      return new EmbedBuilder()
        .setTitle(`${bagIcon} TỦ ĐỒ: ${viewTarget.username.toUpperCase()}`)
        .setColor(0xe74c3c)
        .setDescription(pages[pageIdx])
        .setFooter({ text: `Trang ${pageIdx + 1}/${pages.length} | .tudo lay <ID> <SL>` });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary).setDisabled(pages.length === 1)
    );

    const curMessage = await message.reply({
      embeds: [generateEmbed(0)],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

    if (pages.length === 1) return;

    const collector = curMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 // Nút bấm có hiệu lực trong 60 giây
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id) return i.reply({ content: "Bạn không thể điều khiển menu này!", ephemeral: true });

      if (i.customId === "prev") currentPage--;
      else if (i.customId === "next") currentPage++;

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
        new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary).setDisabled(currentPage === pages.length - 1)
      );

      await i.update({ embeds: [generateEmbed(currentPage)], components: [newRow] });
    });

    collector.on("end", () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      curMessage.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};