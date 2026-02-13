const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, getBalance, removeMoney } = require("../utils/currency.js");
const { FISH_SHOP_ITEMS } = require("../utils/fish.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

module.exports = {
  name: "suacan",
  aliases: ["repair", "baotri"],
  description: "Sửa chữa cần câu bằng loại tiền tương ứng (Mora/Primo).",

  async execute(message, args) {
    const userId = message.author.id;

    const invKey = renderKey("fish_inv", userId);
    let inventory = (await getKey(invKey)) || [];

    if (inventory.length === 0) {
        return message.reply(`${errorIcon} | Túi đồ của bạn đang trống!`);
    }

    let totalMora = 0;
    let totalPrimo = 0;
    let repairList = [];

    // --- LỌC VÀ TÍNH TOÁN CHI PHÍ ---
    inventory.forEach((item, index) => {
      // Chỉ xử lý nếu là object và ID bắt đầu bằng 'cancau'
      if (
        typeof item === "object" &&
        item.id?.toLowerCase().startsWith("cancau")
      ) {
        const itemData = FISH_SHOP_ITEMS[item.id];

        // Nếu cần câu chưa đầy độ bền
        if (itemData && item.durability < itemData.maxDurability) {
          const currency = itemData.currency || "mora";
          const lostDurability = itemData.maxDurability - item.durability;
          const lostRatio = lostDurability / itemData.maxDurability;

          // Phí sửa dựa trên độ hỏng
          let repairRate = currency === "mora" ? 0.8 : 0.6;
          let cost = Math.floor(itemData.price * repairRate * lostRatio);

          // Giá sàn bảo trì
          let minFee = currency === "mora" ? 1000 : 5;
          if (cost < minFee) cost = minFee;

          // Thêm vào danh sách chờ sửa
          repairList.push({
            index: index,
            cost: cost,
            currency: currency,
            max: itemData.maxDurability,
            name: itemData.name,
          });

          // Cộng dồn tổng tiền
          if (currency === "mora") {
            totalMora += cost;
          } else {
            totalPrimo += cost;
          }
        }
      }
    });

    // Nếu không có cần câu nào cần sửa
    if (repairList.length === 0) {
      return message.reply(
        `${verifyIcon} | Hiện tại không có cần câu nào cần được bảo trì.`,
      );
    }

    // --- KIỂM TRA TÀI CHÍNH ---
    const userMora = await getBalance(userId, "mora");
    const userPrimo = await getBalance(userId, "primo");

    if (userMora < totalMora || userPrimo < totalPrimo) {
      let msg = `${errorIcon} | Số dư không đủ để đại tu toàn bộ cần câu!\n`;
      if (totalMora > 0){
         msg += `> Thiếu: **${(totalMora - userMora).toLocaleString()}** ${getIcon("mora")}\n`;
      }       
      if (totalPrimo > 0){
        msg += `> Thiếu: **${(totalPrimo - userPrimo).toLocaleString()}** ${getIcon("primo")}`;
      }        
      return message.reply(msg);
    }

    // --- TIẾN HÀNH TRỪ TIỀN VÀ CẬP NHẬT ĐỘ BỀN ---
    // Chúng ta trừ tổng tiền một lần để tối ưu performance
    if (totalMora > 0) {
        await removeMoney(userId, totalMora, "mora");
    }
    if (totalPrimo > 0) {
        await removeMoney(userId, totalPrimo, "primo");
    }

    for (const rod of repairList) {
      inventory[rod.index].durability = rod.max;
    }

    // Lưu lại inventory mới
    await setKey(invKey, inventory);

    // --- PHẢN HỒI ---
    const embed = new EmbedBuilder()
      .setTitle("🛠️ TRẠM BẢO TRÌ TỰ ĐỘNG")
      .setColor("#2ecc71") // Màu xanh lá biểu thị thành công
      .setDescription(
        `Hệ thống đã nhận diện và sửa chữa thành công **${repairList.length}** chiếc cần câu.`,
      )
      .addFields(
        {
          name: "💰 Chi phí thanh toán",
          value: `${totalMora > 0 ? `**${totalMora.toLocaleString()}** ${getIcon("mora")} ` : ""}${totalPrimo > 0 ? `**${totalPrimo.toLocaleString()}** ${getIcon("primo")}` : ""}`,
        },
        {
          name: "📦 Danh sách đã sửa",
          value: repairList.map((r) => `• ${r.name}`).join("\n"),
        },
      )
      .setFooter({ text: "Mọi cần câu đã phục hồi 100% độ bền." })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
