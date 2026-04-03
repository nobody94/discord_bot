const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey } = require("../utils/db");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "checklog",
  description: "Truy vấn lịch sử giao dịch của một người dùng.",

  async execute(message, args) {
    // Chỉ Dev mới có quyền check log ẩn
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const target = message.mentions.users.first() || { id: args[0] };
    if (!target.id) return message.reply("⚠️ Vui lòng tag người dùng hoặc nhập ID.");

    try {
      const allLogs = (await getKey("transaction_logs")) || [];
      
      // Lọc các giao dịch liên quan đến ID này (cả gửi và nhận)
      const userLogs = allLogs.filter(log => 
        log.senderId === target.id || log.receiverId === target.id
      ).slice(0, 10); // Lấy 10 giao dịch gần nhất

      if (userLogs.length === 0) {
        return message.reply(`Không tìm thấy lịch sử giao dịch nào cho ID \`${target.id}\`.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`📜 Nhật ký giao dịch: ${target.tag || target.id}`)
        .setColor(0x2ecc71)
        .setTimestamp();

      let description = "";
      userLogs.forEach((log, index) => {
        const direction = log.senderId === target.id ? "➡️ Gửi cho" : "⬅️ Nhận bởi";
        const partner = log.senderId === target.id ? `<@${log.receiverId}>` : `<@${log.senderId}>`;
        description += `**${index + 1}.** [${log.time}]\nLệnh:${log.type}\n${direction} **${partner}**: \`${log.details}\`\n`;
      });

      embed.setDescription(description);
      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Lỗi khi truy xuất dữ liệu log.");
    }
  },
};