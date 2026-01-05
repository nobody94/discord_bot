const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { renderKey, getKey } = require('../utils/db');

module.exports = {
  name: "marrylist",
  aliases: ["mrl", "dskethon"],
  async execute(message) {
    const guildId = message.guild.id;
    const coupleKey = renderKey('couple', guildId); //
    const couplesList = (await getKey(coupleKey)) || []; //

    if (couplesList.length === 0) {
      return message.reply("Hiện tại chưa có cặp đôi nào kết hôn trong server này cả! ❤️");
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(couplesList.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const currentItems = couplesList.slice(start, end);

      let description = "";
      currentItems.forEach((couple, index) => {
        const date = new Date(couple.date).toLocaleDateString('vi-VN'); //
        description += `**${start + index + 1}.** <@${couple.husband}> ❤️ <@${couple.wife}>\n└ *Ngày cưới: ${date}*\n Độ thân mật: ${couple.lovePoints}\n`;
      });

      return new EmbedBuilder()
        .setTitle("📜 DANH SÁCH CẶP ĐÔI TRONG SERVER")
        .setColor("#ff69b4")
        .setDescription(description)
        .setFooter({ text: `Trang ${page + 1}/${totalPages} • Tổng cộng ${couplesList.length} cặp đôi` })
        .setTimestamp();
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("Trang trước")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("Trang sau")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const msg = await message.reply({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
    });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: "Chỉ người dùng lệnh mới có thể chuyển trang!", ephemeral: true });
      }

      if (interaction.customId === "prev_page" && currentPage > 0) {
        currentPage--;
      } else if (interaction.customId === "next_page" && currentPage < totalPages - 1) {
        currentPage++;
      }

      await interaction.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};