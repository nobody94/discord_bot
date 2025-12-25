const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, getBalance, removeMoney } = require('../utils/currency.js');
const { FISH_SHOP_ITEMS } = require("../utils/fish.js");
const { errorIcon, verifyIcon } = require('../utils/icon.js');

module.exports = {
  name: "suacan",
  aliases: ["repair", "baotri"],
  description: "Sửa chữa cần câu bằng loại tiền tương ứng (Mora/Primo).",

  async execute(message, args) {
    const userId = message.author.id;
    const itemIdInput = args[0]?.toLowerCase();

    if (!itemIdInput) {
        return message.reply(`${errorIcon} | Vui lòng nhập ID cần câu. Ví dụ: \`.suacan cancau_hoang_kim\``);
    }

    const invKey = renderKey("fish_inv", userId);
    let inventory = (await getKey(invKey)) || [];

    // Tìm cần câu trong túi đồ
    const rodIndex = inventory.findIndex(item => 
        typeof item === 'object' && item.id.toLowerCase() === itemIdInput
    );
    
    if (rodIndex === -1) {
        return message.reply(`${errorIcon} | Bạn không có chiếc cần \`${itemIdInput}\` nào trong túi đồ!`);
    }

    const rod = inventory[rodIndex];
    const itemData = FISH_SHOP_ITEMS[rod.id];
    const currency = itemData.currency || 'mora'; // Lấy loại tiền gốc của cần câu

    if (rod.durability >= itemData.maxDurability) {
        return message.reply(`${errorIcon} | Cần câu này còn rất mới, chưa cần bảo trì.`);
    }

    // --- LOGIC TÍNH GIÁ SỬA ---
    const durabilityLost = itemData.maxDurability - rod.durability;
    const lostPercentage = durabilityLost / itemData.maxDurability;
    
    // Phí sửa tối đa là 40% giá trị mua mới
    let repairCost = Math.floor((itemData.price * 0.35) * lostPercentage);

    // --- THIẾT LẬP GIÁ SÀN BẢO TRÌ ---
    let minFee = 0;
    if (currency === 'mora') {
        minFee = 200; // Giá sàn cho đồ Mora
    } else if (currency === 'primo') {
        minFee = 2;   // Giá sàn cho đồ Primo (ít nhất 1 Primo)
    }

    if (repairCost < minFee) repairCost = minFee;

    // Kiểm tra số dư tài khoản theo loại tiền tương ứng
    const userBalance = await getBalance(userId, currency);
    if (userBalance < repairCost) {
        return message.reply(`${errorIcon} | Phí bảo trì là **${repairCost.toLocaleString()}** ${getIcon(currency)}. Bạn không đủ tiền!`);
    }

    // --- THỰC HIỆN GIAO DỊCH VÀ SỬA CHỮA ---
    await removeMoney(userId, repairCost, currency);
    rod.durability = itemData.maxDurability; // Hồi phục 100%

    await setKey(invKey, inventory);

    const embed = new EmbedBuilder()
        .setTitle("🛠️ BẢO TRÌ CẦN CÂU")
        .setColor(currency === 'primo' ? "#f1c40f" : "#3498db")
        .setDescription(`Bạn đã sử dụng **${repairCost.toLocaleString()}** ${getIcon(currency)} để đại tu chiếc **${itemData.name}**.`)
        .addFields(
            { name: "🔋 Tình trạng", value: `Đã hồi phục hoàn toàn: **${rod.durability}/${itemData.maxDurability}**`, inline: true }
        )
        .setFooter({ text: "Vật phẩm cao cấp cần được bảo trì bằng nhiên liệu tương ứng." });

    return message.reply({ embeds: [embed] });
  }
};