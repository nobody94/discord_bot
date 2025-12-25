const { EmbedBuilder } = require("discord.js");
const { getKey } = require("../utils/db");
const {DEVELOPER_IDS} = require('../utils/constant.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: "fishrank",
  aliases: ["fr", "topca"],
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) || !DEVELOPER_IDS.includes(message.author.id)) {
      return message.reply("Bạn không có quyền sử dụng lệnh này.");
    }

    const topMiss = (await getKey("leaderboard_miss")) || [];
    const topTrash = (await getKey("leaderboard_trash")) || [];

    const embed = new EmbedBuilder()
      .setTitle("🏆 BẢNG XẾP HẠNG NGƯ THỦ VẬN ĐEN")
      .setColor("#e67e22")
      .addFields(
        { 
          name: "💨 TOP HỤT CẦN", 
          value: topMiss.map((u, i) => `**${i+1}.** ${u.name}: \`${u.count}\` lần`).join("\n") || "Trống",
          inline: true 
        },
        { 
          name: "♻️ TOP NHẶT RÁC", 
          value: topTrash.map((u, i) => `**${i+1}.** ${u.name}: \`${u.count}\` món`).join("\n") || "Trống",
          inline: true 
        }
      )
      .setFooter({ text: "Càng đen rank càng cao!" });

    message.reply({ embeds: [embed] });
  }
};