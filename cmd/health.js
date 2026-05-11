const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { getHealthStatus } = require("../utils/health"); 

module.exports = {
    name: "health",
    aliases: ["hp", "sk"],
    description: "Kiểm tra chỉ số máu và trạng thái sức khỏe.",
    async execute(message, args) {
        // Lấy mục tiêu: người được tag hoặc chính người gửi lệnh
        const targetUser = message.mentions.users.first() || message.author;
        const userId = targetUser.id;

        // Truy xuất HP từ Database
        const hpKey = renderKey("health", userId);
        const hp = (await getKey(hpKey)) ?? 100;

        // Lấy thông tin trạng thái từ hàm dùng chung
        const healthInfo = getHealthStatus(hp);

        // Tạo thanh máu hiển thị bằng icon (Visual Health Bar)
        const maxBar = 10;
        const greenCount = Math.ceil(hp / 10);
        const redCount = maxBar - greenCount;
        const healthBar = "🟩".repeat(greenCount) + "🟥".repeat(redCount);

        const embed = new EmbedBuilder()
            .setTitle(`🏥 Chỉ số sức khỏe: ${targetUser.username}`)
            .setColor(hp > 50 ? 0x2ecc71 : hp > 20 ? 0xf1c40f : 0xe74c3c)
            .addFields(
                { name: "Chỉ số HP", value: `**${hp}/100**`, inline: true },
                { name: "Trạng thái", value: healthInfo.status, inline: true },
                { name: "Thanh máu", value: `\`${healthBar}\`` }
            )            
            .setFooter({ text: "Sử dụng vật phẩm hồi phục để tăng HP!" })

        return message.reply({ embeds: [embed] });
    }
};