const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { addMoney, getIcon } = require('../utils/currency.js');
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon, verifyIcon } = require('../utils/icon.js');

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Đi câu cá với hệ thống độ bền cần câu và đếm ngược thời gian.",

  async execute(message, args) {
    const userId = message.author.id;
    
    // 1. KIỂM TRA COOLDOWN (Hồi chiêu 15s - Trong file mẫu là 5s, tôi sẽ giữ theo logic của bạn)
    const cooldownKey = renderKey("cooldown_cauca", userId);
    const lastUsed = await getKey(cooldownKey);
    const cooldownTime = 15 * 1000; 
    const now = Date.now();

    if (lastUsed && now - lastUsed < cooldownTime) {
      const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
      return message.reply(`${errorIcon} | Bạn đang mệt, hãy nghỉ ngơi một chút! Thử lại sau **${timeLeft} giây**.`);
    }

    const fishInvKey = renderKey("fish_inv", userId);
    let fishInventory = (await getKey(fishInvKey)) || [];

    // 2. TÌM CẦN CÂU XỊN NHẤT VÀ MỒI TRONG fish_inv
    let bestRodIndex = -1;
    let rodLuck = 0;
    let baitIndex = -1;

    for (let i = 0; i < fishInventory.length; i++) {
        const entry = fishInventory[i];
        // Cần câu lưu dạng Object { id, durability }, mồi lưu dạng String
        const itemId = typeof entry === 'object' ? entry.id : entry;
        const item = FISH_SHOP_ITEMS[itemId];
        
        if (!item) continue;

        // Tìm cần câu tốt nhất dựa trên chỉ số luck
        if (itemId.includes("cancau") && item.luck > rodLuck) {
            rodLuck = item.luck;
            bestRodIndex = i;
        }
        // Tìm mồi câu đầu tiên
        if (itemId.includes("moica") && baitIndex === -1) {
            baitIndex = i;
        }
    }

    if (bestRodIndex === -1) return message.reply(`${errorIcon} | Bạn không có cần câu trong túi đồ câu (\`fish_inv\`).`);
    if (baitIndex === -1) return message.reply(`${errorIcon} | Bạn không có mồi câu trong túi đồ câu (\`fish_inv\`).`);

    // Lưu cooldown ngay khi bắt đầu thực hiện hành động
    await setKey(cooldownKey, now);

    // 3. XỬ LÝ ĐỘ BỀN VÀ TIÊU THỤ MỒI
    const rodEntry = fishInventory[bestRodIndex];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id];
    
    // Giảm 1 độ bền
    rodEntry.durability -= 1;

    // Lấy thông tin mồi và xóa 1 mồi
    const baitId = fishInventory[baitIndex];
    const baitInfo = FISH_SHOP_ITEMS[baitId];
    const baitLuck = baitInfo.luck || 1.0;
    
    // Xóa mồi khỏi mảng
    fishInventory.splice(baitIndex, 1);

    // Kiểm tra nếu cần câu hết độ bền thì xóa cần
    let rodBroken = false;
    if (rodEntry.durability <= 0) {
        // Tìm lại vị trí cần vì sau khi splice mồi index có thể đã thay đổi
        const currentRodIdx = fishInventory.indexOf(rodEntry);
        if (currentRodIdx !== -1) {
            fishInventory.splice(currentRodIdx, 1);
            rodBroken = true;
        }
    }

    // Cập nhật lại túi đồ câu vào Database
    await setKey(fishInvKey, fishInventory);

    const totalLuck = rodLuck * baitLuck;

    // 4. HIỆU ỨNG ĐẾM NGƯỢC KHI ĐANG CÂU
    let timer = 3;
    const waitingEmbed = new EmbedBuilder()
      .setColor("#3498db")
      .setTitle("🎣 ĐANG THẢ CẦN...")
      .setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền còn lại: **${rodEntry.durability}/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);

    const msg = await message.reply({ embeds: [waitingEmbed] });

    const countdownInterval = setInterval(async () => {
      timer--;
      if (timer <= 0) {
        clearInterval(countdownInterval);
        processFishingResult();
      } else {
        waitingEmbed.setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền còn lại: **${rodEntry.durability}/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);
        await msg.edit({ embeds: [waitingEmbed] }).catch(() => clearInterval(countdownInterval));
      }
    }, 1000);

    // 5. LOGIC XỬ LÝ KẾT QUẢ
    async function processFishingResult() {
      const roll = Math.random();
      let cumulative = 0;
      let caughtFishId = "ca_long_tong";

      // Điều chỉnh trọng số dựa trên luck cho cá hiếm
      const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
        let weight = data.chance;
        if (id === "ca_map" || id === "ca_voi") weight *= totalLuck;
        return { id, weight };
      });

      const totalWeight = adjustedChances.reduce((sum, f) => sum + f.weight, 0);

      for (const f of adjustedChances) {
        cumulative += (f.weight / totalWeight);
        if (roll < cumulative) {
          caughtFishId = f.id;
          break;
        }
      }

      const fish = FISH_LIST[caughtFishId];
      
      // Lưu cá vào bể cá
      const tankKey = renderKey("fishtank", userId);
      const tank = (await getKey(tankKey)) || [];
      tank.push(caughtFishId);
      await setKey(tankKey, tank);
    
      const resultEmbed = new EmbedBuilder()
        .setTitle("🎣 CÁ ĐÃ CẮN CÂU!")
        .setColor(caughtFishId === "ca_voi" ? "#f1c40f" : "#2ecc71")
        .setDescription(`Chúc mừng! Bạn đã câu được **${fish.name}** ${fish.emoji}`)
        .addFields(
          { name: "🍀 May mắn", value: `x${totalLuck.toFixed(1)}`, inline: true }
        )
        .setFooter({ text: 'Dùng lệnh .beca để xem thành quả' });

      if (rodBroken) {
          resultEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Chiếc **${rodData.name}** của bạn đã bị hỏng hoàn toàn!` });
      }

      await msg.edit({ embeds: [resultEmbed] });
    }
  }
};