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

    const formatLeaderboard = (data, unit) => {
      if (data.length === 0) return "📉 *Trống*";
      return data.slice(0, 5).map((u, i) => {
        // #1 sẽ được in đậm đặc biệt
        const prefix = i === 0 ? `**#${i + 1}**` : `#${i + 1}`;
        return `${prefix} | <@${u.id}>: \`${u.count}\` ${unit}`;
      }).join("\n");
    };

   const embed = new EmbedBuilder()
      .setAuthor({ 
        name: "📋 Bảng Xếp Hạng Ngư Thủ", 
        iconURL: message.guild.iconURL() 
      })
      .setColor("#837606ff")
      .addFields(
        { 
          name: "TOP 5 HỤT CẦN 💨", 
          value: formatLeaderboard(topMiss, "lần"),
          inline: true 
        },
        { 
          name: "TOP 5 NHẶT RÁC ♻️", 
          value: formatLeaderboard(topTrash, "món"),
          inline: true 
        }
      )
      .setDescription("✨ **Thêm?** dùng `.cauca` để thử vận may!")
      .setFooter({ 
        text: `${message.author.username} • Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        iconURL: message.author.displayAvatarURL()
      });

    message.reply({ embeds: [embed] });
  }
};