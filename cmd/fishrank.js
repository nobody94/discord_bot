const { EmbedBuilder } = require("discord.js");
const { getKey, setKey } = require("../utils/db"); // Thêm setKey để reset dữ liệu
const { DEVELOPER_IDS } = require('../utils/constant.js');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: "fishrank",
  aliases: ["fr", "topca"],
  async execute(message, args) {
    // Kiểm tra quyền: Chỉ Admin (ManageChannels) hoặc Developer mới được dùng lệnh (bao gồm cả reset)
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !DEVELOPER_IDS.includes(message.author.id)) {
      return message.reply("Bạn không có quyền sử dụng lệnh này.");
    }

    const guildId = message.guild.id;
    const missKey = `leaderboard_miss_${guildId}`; // Key lưu TOP hụt cần
    const trashKey = `leaderboard_trash_${guildId}`; // Key lưu TOP nhặt rác

    // --- LOGIC RESET ---
    if (args[0] && args[0].toLowerCase() === 'reset') {
      await setKey(missKey, []); // Reset mảng hụt cần về trống
      await setKey(trashKey, []); // Reset mảng nhặt rác về trống
      
      return message.reply("✅ Đã reset toàn bộ bảng xếp hạng ngư thủ của server này!");
    }

    // --- LOGIC HIỂN THỊ (GIỮ NGUYÊN) ---
    const topMiss = (await getKey(missKey)) || [];
    const topTrash = (await getKey(trashKey)) || [];

    const formatLeaderboard = (data, unit) => {
      if (data.length === 0) return "📉 *Trống*";
      return data.slice(0, 5).map((u, i) => {
        const prefix = i === 0 ? `**#${i + 1}**` : `#${i + 1}`;
        return `${prefix} | <@${u.id}>: \`${u.count}\` ${unit}`;
      }).join("\n");
    };

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: "📋 Bảng Xếp Hạng Ngư Thủ", 
        iconURL: message.guild.iconURL() 
      })
      .setColor("#e74c3c")
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