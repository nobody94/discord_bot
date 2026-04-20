const { DEVELOPER_IDS } = require("../utils/constant.js");
const { getKey, setKey } = require("../utils/db"); // Đảm bảo đã import setKey
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "checklog",
  description: "Truy vấn hoặc xóa lịch sử giao dịch.",

  async execute(message, args) {
    // Chỉ Dev mới có quyền thực hiện các lệnh này
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    // --- CHỨC NĂNG CLEAR LOG ---
    if (args[0]?.toLowerCase() === "clear") {
      try {
        await setKey("transaction_logs", []); // Reset mảng log về rỗng
        return message.reply("✅ Đã xóa toàn bộ lịch sử giao dịch thành công.");
      } catch (err) {
        console.error(err);
        return message.reply("❌ Lỗi khi xóa dữ liệu log.");
      }
    }

    // --- CHỨC NĂNG TRUY VẤN LOG (NHƯ CŨ) ---
    const target = message.mentions.users.first() || { id: args[0] };
    if (!target.id) return message.reply("⚠️ Vui lòng tag người dùng, nhập ID hoặc dùng `clear`.");

    const page = parseInt(args[1]) || 1;
    const logsPerPage = 10;

    try {
      const allLogs = (await getKey("transaction_logs")) || [];
      
      const userLogs = allLogs.filter(log => 
        log.senderId === target.id || log.receiverId === target.id
      ).reverse();

      if (userLogs.length === 0) {
        return message.reply(`Không tìm thấy lịch sử giao dịch nào cho ID \`${target.id}\`.`);
      }

      const totalPages = Math.ceil(userLogs.length / logsPerPage);
      if (page > totalPages || page <= 0) {
        return message.reply(`⚠️ Trang không hợp lệ. Tổng cộng có **${totalPages}** trang.`);
      }

      const start = (page - 1) * logsPerPage;
      const end = start + logsPerPage;
      const paginatedLogs = userLogs.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle(`📜 Nhật ký: ${target.tag || target.id}`)
        .setColor(0x2ecc71)
        .setFooter({ text: `Trang ${page}/${totalPages} • Tổng ${userLogs.length} giao dịch` })
        .setTimestamp();

      let description = "";
      paginatedLogs.forEach((log, index) => {
        const globalIndex = start + index + 1;
        const direction = log.senderId === target.id ? "➡️ Gửi" : "⬅️ Nhận";
        const partnerId = log.senderId === target.id ? log.receiverId : log.senderId;
        
        description += `**${globalIndex}.** [${log.time}]\n` +
                       `Lệnh: \`${log.type}\` | ${direction}: <@${partnerId}>\n` +
                       `Chi tiết: \`${log.details}\`\n\n`;
      });

      embed.setDescription(description);
      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      message.reply("❌ Lỗi khi truy xuất dữ liệu log.");
    }
  },
};