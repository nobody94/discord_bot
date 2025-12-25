const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon } = require('../utils/icon.js');

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Đi câu cá với hệ thống độ bền, may mắn, giảm rác và ghi nhận kỷ lục.",

  async execute(message, args) {
    const userId = message.author.id;
    
    // 1. KIỂM TRA COOLDOWN (15s)
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

    // 2. TÌM CẦN CÂU VÀ MỒI XỊN NHẤT
    let bestRodIndex = -1;
    let rodLuck = 0;
    let baitIndex = -1;

    for (let i = 0; i < fishInventory.length; i++) {
        const entry = fishInventory[i];
        const itemId = typeof entry === 'object' ? entry.id : entry;
        const item = FISH_SHOP_ITEMS[itemId];
        
        if (!item) continue;

        if (itemId.includes("cancau") && item.luck > rodLuck) {
            rodLuck = item.luck;
            bestRodIndex = i;
        }
        if (itemId.includes("moica") && baitIndex === -1) {
            baitIndex = i;
        }
    }

    if (bestRodIndex === -1) return message.reply(`${errorIcon} | Bạn không có cần câu trong túi đồ câu.`);
    if (baitIndex === -1) return message.reply(`${errorIcon} | Bạn không có mồi câu trong túi đồ câu.`);

    await setKey(cooldownKey, now);

    // 3. THIẾT LẬP THÔNG SỐ
    const rodEntry = fishInventory[bestRodIndex];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id];
    const baitId = fishInventory[baitIndex];
    const baitInfo = FISH_SHOP_ITEMS[baitId];
    const totalLuck = rodLuck * (baitInfo.luck || 1.0);

    // Tiêu thụ độ bền và mồi
    rodEntry.durability -= 1;
    fishInventory.splice(baitIndex, 1);

    let rodBroken = false;
    if (rodEntry.durability <= 0) {
        const currentRodIdx = fishInventory.indexOf(rodEntry);
        if (currentRodIdx !== -1) {
            fishInventory.splice(currentRodIdx, 1);
            rodBroken = true;
        }
    }

    await setKey(fishInvKey, fishInventory);

    // 4. HIỆU ỨNG CHỜ ĐỢI
    let timer = 3;
    const waitingEmbed = new EmbedBuilder()
      .setColor("#3498db")
      .setTitle("🎣 ĐANG THẢ CẦN...")
      .setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền: **${Math.max(0, rodEntry.durability)}/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);

    const msg = await message.reply({ embeds: [waitingEmbed] });

    const countdownInterval = setInterval(async () => {
      timer--;
      if (timer <= 0) {
        clearInterval(countdownInterval);
        processFishingResult();
      } else {
        waitingEmbed.setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền: **${Math.max(0, rodEntry.durability)}/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);
        await msg.edit({ embeds: [waitingEmbed] }).catch(() => clearInterval(countdownInterval));
      }
    }, 1000);

    // 5. LOGIC KẾT QUẢ
    async function processFishingResult() {
      // --- A. XỬ LÝ HỤT CÁ (Giảm theo Luck) ---
      const baseMissRate = 0.15;
      const missRate = Math.max(0.05, baseMissRate - (totalLuck * 0.02)); 

      if (Math.random() < missRate) {
        // Tăng stats hụt cho Rank
        const missCountKey = renderKey("stats_miss", userId);
        const currentMiss = (await getKey(missCountKey)) || 0;
        await setKey(missCountKey, currentMiss + 1);

        const missMessages = [
            "Con cá ăn sạch mồi rồi để lại mẩu giấy: 'Mồi này hơi lạt, thêm tí muối nhé!'",
            "Bạn vừa kéo lên thì thấy một con cá đang đứng trên mặt nước... vẫy tay chào tạm biệt.",
            "Con cá đớp mất mồi và để lại tờ giấy: 'Mồi dở quá, lần sau mua mồi xịn hơn nhé!'",
            "Bạn nghe thấy tiếng cá thì thầm: 'Cần câu đẹp đấy, nhưng mồi thì... còn lâu nhé!'"
        ];
        
        const missEmbed = new EmbedBuilder()
          .setTitle("💨 HỤT MẤT RỒI!")
          .setColor("#e74c3c")
          .setDescription(missMessages[Math.floor(Math.random() * missMessages.length)]);

        if (rodBroken) missEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Cú kéo mạnh của cá đã làm gãy chiếc **${rodData.name}**!` });
        return await msg.edit({ embeds: [missEmbed] });
      }

      // --- B. XỬ LÝ TỈ LỆ CÁ & RÁC ---
      const roll = Math.random();
      let cumulative = 0;
      let caughtFishId = "ca_long_tong";

      const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
        let weight = data.chance;

        // Tăng cá hiếm, phạt cần cùi (Luck < 2.0)
        if (id === "ca_map" || id === "ca_voi") {
          weight *= totalLuck;
          if (totalLuck < 2.0) weight *= 0.4; 
        } 
        // Giảm rác khi Luck cao (Item giá < 10 là rác)
        else if (data.sellPrice < 10) {
          weight = weight / totalLuck;
        }

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
      const isTrash = fish.sellPrice < 10;

      // Cập nhật Rank rác nếu trúng rác
      if (isTrash) {
        const trashCountKey = renderKey("stats_trash", userId);
        const currentTrash = (await getKey(trashCountKey)) || 0;
        await setKey(trashCountKey, currentTrash + 1);
      }

      // Lưu cá vào bể
      const tankKey = renderKey("fishtank", userId);
      const tank = (await getKey(tankKey)) || [];
      tank.push(caughtFishId);
      await setKey(tankKey, tank);
    
      const resultEmbed = new EmbedBuilder()
        .setTitle(isTrash ? "♻️ CÂU ĐƯỢC RÁC..." : "🎣 CÁ ĐÃ CẮN CÂU!")
        .setColor(caughtFishId === "ca_voi" ? "#f1c40f" : (isTrash ? "#95a5a6" : "#2ecc71"))
        .setDescription(`Bạn đã kéo lên được: **${fish.name}** ${fish.emoji}`)
        .addFields({ name: "🍀 May mắn", value: `x${totalLuck.toFixed(1)}`, inline: true })
        .setFooter({ text: 'Dùng lệnh .beca để xem thành quả' });

      if (rodBroken) resultEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Chiếc **${rodData.name}** của bạn đã bị hỏng hoàn toàn!` });

      await msg.edit({ embeds: [resultEmbed] });
    }
  }
};