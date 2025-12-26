const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey, updateLeaderboard } = require("../utils/db");
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon } = require('../utils/icon.js');
const { getIcon } = require('../utils/currency.js');

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Hệ thống câu cá chuyên nghiệp với bộ đếm ngược thời gian thực.",

  async execute(message, args) {
    const userId = message.author.id;
    const username = message.author.username;
    const guildId = message.guild.id;

    // 1. KIỂM TRA COOLDOWN (10 giây)
    const cooldownKey = renderKey("cooldown_cauca", userId);
    const lastUsed = await getKey(cooldownKey);
    const now = Date.now();

    if (lastUsed && now - lastUsed < 10000) {
      const timeLeftCooldown = Math.ceil((10000 - (now - lastUsed)) / 1000);
      return message.reply(`${errorIcon} | Chờ **${timeLeftCooldown} giây** nữa để tiếp tục thả cần!`);
    }

    // 2. KIỂM TRÁ ĐỒ CÂU VÀ MỒI TRONG TÚI
    const fishInvKey = renderKey("fish_inv", userId);
    let inventory = (await getKey(fishInvKey)) || [];

    let rodIdx = -1, baitIdx = -1, rodLuck = 0;
    inventory.forEach((item, i) => {
      const itemId = item.id || item;
      const data = FISH_SHOP_ITEMS[itemId];
      if (!data) return;

      if (itemId.includes("cancau") && data.luck > rodLuck) {
        rodLuck = data.luck;
        rodIdx = i;
      }
      if (itemId.includes("moica") && baitIdx === -1) {
        baitIdx = i;
      }
    });

    if (rodIdx === -1) return message.reply(`${errorIcon} | Bạn không có cần câu!`);
    if (baitIdx === -1) return message.reply(`${errorIcon} | Bạn đã hết mồi câu!`);

    // 3. THIẾT LẬP THÔNG SỐ & TIÊU HAO
    const rodEntry = inventory[rodIdx];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id || rodEntry];
    const baitItem = inventory[baitIdx];
    const baitId = baitItem.id || baitItem;
    const baitData = FISH_SHOP_ITEMS[baitId];
    
    const totalLuck = rodLuck * (baitData.luck || 1.0);

    // Trừ độ bền cần câu và mất 1 mồi câu
    rodEntry.durability -= 1;
    inventory.splice(baitIdx, 1);

    let rodBroken = false;
    if (rodEntry.durability <= 0) {
      inventory.splice(inventory.indexOf(rodEntry), 1);
      rodBroken = true;
    }

    // Lưu trạng thái túi đồ và cooldown ngay lập tức
    await setKey(fishInvKey, inventory);
    await setKey(cooldownKey, now);

    // 4. HIỂN THỊ GIAO DIỆN CHỜ CÓ ĐẾM NGƯỢC
    let secondsLeft = 3; 
    const createWaitingEmbed = (seconds) => {
      return new EmbedBuilder()
        .setColor("#3498db")
        .setTitle("🎣 ĐANG THẢ CẦN...")
        .setDescription(`Cần: **${rodData.name}** | Mồi: **${baitData.name}**\nĐộ bền: **${Math.max(0, rodEntry.durability)}/${rodData.maxDurability}**\n\n*Đang chờ cá cắn câu sau **${seconds}** giây...*`);
    };

    const msg = await message.reply({ embeds: [createWaitingEmbed(secondsLeft)] });

    // Vòng lặp đếm ngược mỗi giây
    const countdownInterval = setInterval(async () => {
      secondsLeft--;
      if (secondsLeft > 0) {
        await msg.edit({ embeds: [createWaitingEmbed(secondsLeft)] }).catch(() => null);
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // 5. XỬ LÝ KẾT QUẢ SAU KHI ĐẾM NGƯỢC XONG (3 GIÂY)
    setTimeout(async () => {
      clearInterval(countdownInterval); // Đảm bảo dọn dẹp interval

      // --- A. TỈ LỆ HỤT (Dựa trên Luck) ---
      const missRate = Math.max(0.01, 0.15 - (totalLuck * 0.025));
      if (Math.random() < missRate) {
        await updateLeaderboard("miss", userId, username, guildId); // Ghi danh hụt theo Guild

        const missMsgs = [
          "Con cá ăn sạch mồi rồi để lại giấy: 'Mồi dở quá, mua mồi xịn đi!'",
          "Bạn giật cần quá mạnh, con cá hoảng sợ chạy mất tiêu.",
          "Cá đớp mồi xong còn vẫy đuôi chào tạm biệt bạn...",
          "Phao rung dữ dội nhưng kéo lên chỉ còn cái lưỡi câu không."
        ];

        const missEmbed = new EmbedBuilder()
          .setTitle("💨 HỤT MẤT RỒI!")
          .setColor("#e74c3c")
          .setDescription(missMsgs[Math.floor(Math.random() * missMsgs.length)])
          .setFooter({ text: "Đã ghi nhận 1 lần hụt vào Bảng Xếp Hạng Đen." });

        if (rodBroken) missEmbed.addFields({ name: "⚠️ RẮC!", value: "Cần câu của bạn đã gãy!" });
        return msg.edit({ embeds: [missEmbed] }).catch(() => null);
      }

      // --- B. TỈ LỆ CÁ / RÁC ---
      const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
        let weight = data.chance;
        if (id === "ca_voi" || id === "ca_map") {
          weight *= totalLuck;
          if (rodEntry.id === "cancau_hoang_kim" && id === "ca_voi") weight *= 3;
          if (totalLuck < 2.0) weight *= 0.4;
        } else if (data.sellPrice < 10) {
          weight /= Math.pow(totalLuck, 2);
        }
        return { id, weight };
      });

      const totalWeight = adjustedChances.reduce((sum, f) => sum + f.weight, 0);
      const roll = Math.random();
      let cumulative = 0;
      let caughtId = "ca_long_tong";

      for (const f of adjustedChances) {
        cumulative += f.weight / totalWeight;
        if (roll < cumulative) {
          caughtId = f.id;
          break;
        }
      }

      const fish = FISH_LIST[caughtId];
      const isTrash = fish.sellPrice < 10;
      if (isTrash) await updateLeaderboard("trash", userId, username, guildId);

      // Lưu cá vào bể (Fishtank)
      const tankKey = renderKey("fishtank", userId);
      const tank = (await getKey(tankKey)) || [];
      tank.push(caughtId);
      await setKey(tankKey, tank);

      // --- C. EMBED KẾT QUẢ CUỐI CÙNG ---
      const resultEmbed = new EmbedBuilder()
        .setTitle(isTrash ? "♻️ CÂU ĐƯỢC RÁC..." : "🎣 CÁ ĐÃ CẮN CÂU!")
        .setColor(caughtId === "ca_voi" ? "#f1c40f" : (isTrash ? "#95a5a6" : "#2ecc71"))
        .setDescription(`Chúc mừng! Bạn đã kéo lên được:\n**${fish.name}** ${fish.icon}`)
        .addFields(
          { name: "🍀 May mắn", value: `x${totalLuck.toFixed(1)}`, inline: true },
          { name: "💰 Giá trị", value: `${fish.sellPrice} ${getIcon(fish.currency)}`, inline: true }
        );

      if (rodBroken) {
        resultEmbed.addFields({ name: "⚠️ THÔNG BÁO", value: `Chiếc **${rodData.name}** đã bị hỏng hoàn toàn sau cú giật này!` });
      }

      await msg.edit({ embeds: [resultEmbed] }).catch(() => null);
    }, 3000);
  }
};