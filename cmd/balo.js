const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { bagIcon } = require("../utils/icon.js");
const { baloHandler } = require("../game/baloHandler.js");

module.exports = {
  name: "balo",
  description: "Xem các vật phẩm bạn đang sở hữu với tính năng phân trang.",

  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const userId = targetUser.id;
    const username = targetUser.username;
    const invKey = renderKey("inventory", userId);
    const inventory = (await getKey(invKey)) || [];

    // 1. XỬ LÝ LỆNH PHỤ (SELL, GIVE, OPEN, CAT)
    if (args[0] && ["sell", "give", "open", "cat"].includes(args[0].toLowerCase())) {
      const authorId = message.author.id;
      const authorBaloKey = renderKey("inventory", authorId);
      let authorBalo = (await getKey(authorBaloKey)) || [];

      // Truyền dữ liệu vào handler để xử lý logic backend
      const isHandled = await baloHandler(args, message, authorBalo, authorBaloKey, authorId);
      if (isHandled) return;
      return; // Dừng lại sau khi thực hiện lệnh phụ
    }

    // 2. LOGIC HIỂN THỊ TÚI ĐỒ (FIX LỖI 4096 KÝ TỰ)
    if (inventory.length === 0) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(0x3498db).setDescription(`${bagIcon} Túi đồ của **${username}** đang trống rỗng...`)]
      });
    }

    // Gom nhóm và đếm số lượng
    const counts = {};
    inventory.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });

    const itemList = Object.entries(counts)
      .map(([id, count]) => {
        const item = SHOP_ITEMS[id] || { name: id, icon: "📦" };
        return { ...item, count, id };
      })
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // Chia danh sách thành các trang (10 món mỗi trang)
    const itemsPerPage = 20;
    const pages = [];
    for (let i = 0; i < itemList.length; i += itemsPerPage) {
      const current = itemList.slice(i, i + itemsPerPage);
      const description = current
        .map((item, index) => `**${i + index + 1}.** ${item.icon} **${item.name}** x${item.count} (ID: \`${item.id}\`)`)
        .join("\n");
      pages.push(description);
    }

    let currentPage = 0;

    const generateEmbed = (pageIdx) => {
      return new EmbedBuilder()
        .setTitle(`${bagIcon} TÚI ĐỒ: ${username.toUpperCase()}`)
        .setColor(0x3498db)
        .setDescription(pages[pageIdx])
        .setFooter({
          text: `Trang ${pageIdx + 1}/${pages.length} • Lệnh: .balo open/sell/give/cat`,
        });
    };

    // Tạo nút bấm
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("prev_balo").setLabel("⬅️").setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId("next_balo").setLabel("➡️").setStyle(ButtonStyle.Primary).setDisabled(pages.length === 1)
    );

    const curMessage = await message.reply({
      embeds: [generateEmbed(0)],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

    if (pages.length === 1) return;

    // Bộ thu thập sự kiện nút bấm
    const collector = curMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id) return i.reply({ content: "Bạn không thể dùng nút của người khác!", ephemeral: true });

      if (i.customId === "prev_balo") currentPage--;
      else if (i.customId === "next_balo") currentPage++;

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("prev_balo").setLabel("⬅️").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
        new ButtonBuilder().setCustomId("next_balo").setLabel("➡️").setStyle(ButtonStyle.Primary).setDisabled(currentPage === pages.length - 1)
      );

      await i.update({ embeds: [generateEmbed(currentPage)], components: [updatedRow] });
    });

    collector.on("end", () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("prev_balo").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("next_balo").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      curMessage.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};