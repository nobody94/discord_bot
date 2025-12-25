const { EmbedBuilder } = require("discord.js");
const { renderKey, getAllData } = require("../utils/db"); // Giả sử bạn có hàm getAllData để lấy toàn bộ DB
const { errorIcon } = require('../utils/icon.js');

module.exports = {
  name: "fishrank",
  aliases: ["fr", "topca"],
  description: "Xem bảng xếp hạng những ngư thủ 'vận đen' nhất server.",

  async execute(message, args) {
    // 1. LẤY TOÀN BỘ DỮ LIỆU TỪ DATABASE
    // Lưu ý: Tùy vào loại DB bạn dùng, cách lấy tất cả các key có thể khác nhau.
    // Ở đây giả định hệ thống DB của bạn có thể trả về một object chứa tất cả data.
    const allData = await getAllData(); 
    if (!allData) return message.reply(`${errorIcon} | Không thể truy xuất dữ liệu bảng xếp hạng.`);

    let missLeadeboard = [];
    let trashLeaderboard = [];

    // 2. LỌC DỮ LIỆU THEO TIỀN TỐ STATS
    for (const key in allData) {
      // Lọc rank hụt cá
      if (key.startsWith("stats_miss_")) {
        const userId = key.replace("stats_miss_", "");
        missLeadeboard.push({ userId, count: allData[key] });
      }
      // Lọc rank câu rác
      if (key.startsWith("stats_trash_")) {
        const userId = key.replace("stats_trash_", "");
        trashLeaderboard.push({ userId, count: allData[key] });
      }
    }

    // 3. SẮP XẾP GIẢM DẦN
    missLeadeboard.sort((a, b) => b.count - a.count);
    trashLeaderboard.sort((a, b) => b.count - a.count);

    // Lấy Top 5 mỗi loại
    const topMiss = missLeadeboard.slice(0, 5);
    const topTrash = trashLeaderboard.slice(0, 5);

    // 4. TẠO EMBED HIỂN THỊ
    const rankEmbed = new EmbedBuilder()
      .setTitle("🏆 BẢNG XẾP HẠNG NGƯ THỦ 'VẬN ĐEN'")
      .setColor("#e67e22")
      .setThumbnail(message.guild.iconURL())
      .addFields(
        { 
          name: "💨 VUA HỤT CẦN (Miss nhiều nhất)", 
          value: topMiss.length > 0 
            ? topMiss.map((u, i) => `**${i + 1}.** <@${u.userId}>: \`${u.count}\` lần`).join("\n") 
            : "Chưa có dữ liệu",
          inline: false 
        },
        { 
          name: "♻️ CHÚA TỂ RÁC THẢI (Câu rác nhiều nhất)", 
          value: topTrash.length > 0 
            ? topTrash.map((u, i) => `**${i + 1}.** <@${u.userId}>: \`${u.count}\` món`).join("\n") 
            : "Chưa có dữ liệu",
          inline: false 
        }
      )
      .setFooter({ text: "Càng đen rank càng cao! Cố gắng lên các ngư thủ." })
      .setTimestamp();

    await message.reply({ embeds: [rankEmbed] });
  }
};