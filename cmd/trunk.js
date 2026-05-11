const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { SHOP_ITEMS, type } = require("../utils/blackmarket.js");
const { bagIcon } = require("../utils/icon.js");
const { trunkHandler } = require("../game/trunkHandler.js");

module.exports = {
  name: "trunk",
  description: "Xem các vật phẩm bạn đang sở hữu với tính năng phân trang.",
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const userId = targetUser.id;
    const username = targetUser.username;
    const invKey = renderKey("trunk", userId);
    const inventory = (await getKey(invKey)) || [];

    if (
      args[0] &&
      ["sell", "give", "throw", "use"].includes(args[0].toLowerCase())
    ) {
      const authorId = message.author.id;
      const authorBaloKey = renderKey("trunk", authorId);
      let authorBalo = (await getKey(authorBaloKey)) || [];

      // Truyền dữ liệu vào handler để xử lý logic backend
      const handlerTrunk = await trunkHandler(
        args,
        message,
        authorBalo,
        authorBaloKey,
        authorId,
      );
      if (handlerTrunk) return;
      return; // Dừng lại sau khi thực hiện lệnh phụ
    }

    if (inventory.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3498db)
            .setDescription(`🔑 Kho đồ của **${username}** đang trống rỗng...`),
        ],
      });
    }

    const counts = {};
    inventory.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    const itemList = Object.entries(counts)
      .map(([id, count]) => {
        const item = SHOP_ITEMS[id] || { name: id, icon: "📦" };
        return { ...item, count, id };
      })
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const itemsPerPage = 20;
    const pages = [];
    for (let i = 0; i < itemList.length; i += itemsPerPage) {
      const current = itemList.slice(i, i + itemsPerPage);
      const description = current
        .map((item, index) => {
          let message = "";
          if (item.type == type.damage) {
            message += `\n⚔️ Sát thương: \`${item.minDmg} - ${item.maxDmg}\`HP`;
          }

          if (item.type == type.healing) {
            message += `\n💚 Hồi phục: \`${item.minHeal} - ${item.maxHeal}\`HP`;
          }

          if (item.type == type.revive) {
            message += `\n❤️ Hồi sinh: ${item.minHealOther == item.maxHealOther ? `\`${item.minHealOther}\`` : `\`${item.minHealOther} - ${item.maxHealOther}\``}HP`;
          }
          return `**${i + index + 1}.** ${item.icon} **${item.name}** x${item.count} (ID: \`${item.id}\`)${message}`;
        })
        .join("\n");
      pages.push(description);
    }

    let currentPage = 0;

    const generateEmbed = (pageIdx) => {
      return new EmbedBuilder()
        .setTitle(`🔑 Kho đồ của ${username.toUpperCase()}`)
        .setColor(0x3498db)
        .setDescription(pages[pageIdx])
        .setFooter({
          text: `Trang ${pageIdx + 1}/${pages.length} • Lệnh: .trunk sell/give/throw`,
        });
    };

    // Tạo nút bấm
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev_balo")
        .setLabel("⬅️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next_balo")
        .setLabel("➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length === 1),
    );

    const curMessage = await message.reply({
      embeds: [generateEmbed(0)],
      components: [row],
      allowedMentions: { repliedUser: false },
    });

    if (pages.length === 1) return;

    // Bộ thu thập sự kiện nút bấm
    const collector = curMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id)
        return i.reply({
          content: "Bạn không thể dùng nút của người khác!",
          ephemeral: true,
        });

      if (i.customId === "prev_balo") currentPage--;
      else if (i.customId === "next_balo") currentPage++;

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_balo")
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next_balo")
          .setLabel("➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === pages.length - 1),
      );

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [updatedRow],
      });
    });

    collector.on("end", () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_balo")
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next_balo")
          .setLabel("➡️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      );
      curMessage.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
