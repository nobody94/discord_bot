const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getKey: getBalance } = require("../utils/db"); // Tùy chỉnh theo hệ thống của bạn
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon } = require('../utils/icon.js');

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Đi câu cá với hệ thống độ bền, may mắn và tỉ lệ hụt thông minh.",

  async execute(message, args) {
    const userId = message.author.id;
    
    // 1. KIỂM TRA COOLDOWN (15s)
    const cooldownKey = renderKey("cooldown_cauca", userId);
    const lastUsed = await getKey(cooldownKey);
    const cooldownTime = 5 * 1000; 
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

    // 3. XỬ LÝ ĐỘ BỀN VÀ THÔNG SỐ LUCK
    const rodEntry = fishInventory[bestRodIndex];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id];
    const baitId = fishInventory[baitIndex];
    const baitInfo = FISH_SHOP_ITEMS[baitId];
    const totalLuck = rodLuck * (baitInfo.luck || 1.0);

    // Giảm độ bền và mất mồi
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
      .setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nMay mắn: **x${totalLuck.toFixed(1)}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);

    const msg = await message.reply({ embeds: [waitingEmbed] });

    const countdownInterval = setInterval(async () => {
      timer--;
      if (timer <= 0) {
        clearInterval(countdownInterval);
        processFishingResult();
      } else {
        waitingEmbed.setDescription(`Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nMay mắn: **x${totalLuck.toFixed(1)}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`);
        await msg.edit({ embeds: [waitingEmbed] }).catch(() => clearInterval(countdownInterval));
      }
    }, 1000);

    // 5. LOGIC KẾT QUẢ (GIẢM HỤT & GIẢM RÁC THEO LUCK)
    async function processFishingResult() {
      // --- A. TỈ LỆ HỤT (MISS RATE) ---
      // Cần càng xịn, Luck càng cao thì càng khó bị hụt.
      const baseMissRate = 0.15;
      const missRate = Math.max(0.05, baseMissRate - (totalLuck * 0.02)); 

      if (Math.random() < missRate) {
        const missMessages = [
            "Con cá ăn sạch mồi rồi để lại mẩu giấy: 'Mồi này hơi lạt, lần sau thêm tí muối nhé!'",
            "Bạn vừa kéo lên thì thấy một con cá đang đứng trên mặt nước... vẫy tay chào tạm biệt.",
            "Con cá không những ăn mất mồi mà còn để lại lời nhắn: 'Mồi dở quá, lần sau mua mồi xịn hơn nhé!'",
            "Phao rung rất mạnh, nhưng hóa ra là một con cua đang nhảy múa dưới đó...",
            "Bạn nghe thấy tiếng cá thì thầm: 'Cần câu đẹp đấy, nhưng mồi thì... còn lâu nhé!'"
        ];
        const randomMsg = missMessages[Math.floor(Math.random() * missMessages.length)];
        
        const missEmbed = new EmbedBuilder()
          .setTitle("💨 HỤT MẤT RỒI!")
          .setColor("#e74c3c")
          .setDescription(`${randomMsg}\n\n*(Tỉ lệ hụt lượt này: ${(missRate * 100).toFixed(1)}%)*`);

        if (rodBroken) missEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Cú kéo mạnh của cá đã làm gãy chiếc **${rodData.name}**!` });
        return await msg.edit({ embeds: [missEmbed] });
      }

      // --- B. TỈ LỆ CÁ & RÁC ---
      const roll = Math.random();
      let cumulative = 0;
      let caughtFishId = "ca_long_tong";

      const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
        let weight = data.chance;

        // 1. Cá hiếm (Cá Mập, Cá Voi): Tăng mạnh theo Luck, phạt nặng nếu Luck thấp
        if (id === "ca_map" || id === "ca_voi") {
          weight *= totalLuck;
          if (totalLuck < 2.0) weight *= 0.5; 
        } 
        // 2. Đồ rác (Giá < 10): Giảm mạnh khi Luck cao
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
      const tankKey = renderKey("fishtank", userId);
      const tank = (await getKey(tankKey)) || [];
      tank.push(caughtFishId);
      await setKey(tankKey, tank);
    
      const isTrash = fish.sellPrice < 10;
      const resultEmbed = new EmbedBuilder()
        .setTitle(isTrash ? "♻️ CÂU ĐƯỢC... RÁC?" : "🎣 CÁ ĐÃ CẮN CÂU!")
        .setColor(caughtFishId === "ca_voi" ? "#f1c40f" : (isTrash ? "#95a5a6" : "#2ecc71"))
        .setDescription(`Bạn đã kéo lên được: **${fish.name}** ${fish.emoji}`)
        .addFields({ name: "🍀 May mắn", value: `x${totalLuck.toFixed(1)}`, inline: true })
        .setFooter({ text: 'Dùng lệnh .beca để xem thành quả' });

      if (rodBroken) resultEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Chiếc **${rodData.name}** của bạn đã bị hỏng hoàn toàn!` });

      await msg.edit({ embeds: [resultEmbed] });
    }
  }
};