const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey, updateLeaderboard } = require("../utils/db");
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { getIcon } = require('../utils/currency.js');

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Câu cá nhiều lần (Max 5). Ví dụ: .cc 5",

  async execute(message, args) {
    const userId = message.author.id;
    const username = message.author.username;
    const guildId = message.guild.id;

    // 1. XỬ LÝ THAM SỐ SỐ LẦN CÂU (Mặc định 1, tối đa 5)
    let times = parseInt(args[0]) || 1;
    if (times < 1) times = 1;
    if (times > 5) times = 5;

    // 2. KIỂM TRA COOLDOWN
    const cooldownKey = renderKey("cooldown_cauca", userId);
    const lastUsed = await getKey(cooldownKey);
    const now = Date.now();
    
    // Cooldown mặc định 10s, nếu câu nhiều lần thì 1 phút (60s)
    const currentCooldown = lastUsed?.limit || 10000; 

    if (lastUsed && now - lastUsed.time < currentCooldown) {
      const timeLeft = Math.ceil((currentCooldown - (now - lastUsed.time)) / 1000);
      return message.reply(`${errorIcon} | Chờ **${timeLeft} giây** nữa để tiếp tục!`).then((msg) => {
        setTimeout(() => msg.delete().catch(() => null), 3000);
      });
    }

    // 3. KIỂM TRA ĐỒ CÂU VÀ MỒI
    const fishInvKey = renderKey("fish_inv", userId);
    let inventory = (await getKey(fishInvKey)) || [];

    let rodIdx = -1, rodLuck = 0;
    let baitIndices = [];

    inventory.forEach((item, i) => {
      const itemId = item.id || item;
      const data = FISH_SHOP_ITEMS[itemId];
      if (!data) return;

      if (itemId.includes("cancau") && data.luck > rodLuck) {
        rodLuck = data.luck;
        rodIdx = i;
      }
      if (itemId.includes("moica")) {
        baitIndices.push(i);
      }
    });

    if (rodIdx === -1) return message.reply(`${errorIcon} | Bạn không có cần câu!`);
    if (baitIndices.length < times) return message.reply(`${errorIcon} | Bạn không đủ mồi để câu **${times}** lần!`);

    const rodEntry = inventory[rodIdx];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id || rodEntry];
    
    if (rodEntry.durability < times) {
        return message.reply(`${errorIcon} | Cần câu không đủ độ bền để câu **${times}** lần!`);
    }

    // 4. THỰC HIỆN TIÊU HAO VÀ TÍNH TOÁN KẾT QUẢ
    const tankKey = renderKey("fishtank", userId);
    const tank = (await getKey(tankKey)) || [];
    let caughtFishList = [];
    let missCount = 0;
    let totalLuck = rodLuck; // Tính toán luck dựa trên mồi đầu tiên (đơn giản hóa)

    // Trừ độ bền và mồi
    rodEntry.durability -= times;
    // Xóa mồi (Xóa từ dưới lên để không lệch Index)
    for (let i = 0; i < times; i++) {
        const idx = inventory.findLastIndex(item => (item.id || item).includes("moica"));
        inventory.splice(idx, 1);
    }

    // Vòng lặp tính toán kết quả cho từng lần câu
    for (let i = 0; i < times; i++) {
        const missRate = Math.max(0.01, 0.15 - (totalLuck * 0.025));
        if (Math.random() < missRate) {
            missCount++;
            await updateLeaderboard("miss", userId, username, guildId);
            continue; // Hụt lượt này
        }

        const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
            let weight = data.chance;
            if (data.currency == 'primo' || data.sellPrice >= 1000) {
                weight *= totalLuck;
                if (rodEntry.id === "cancau_hoang_kim" && data.currency == 'primo') weight *= 3;
                if (totalLuck < 2.0) weight *= 0.4;                
            } else if (data.sellPrice < 10) {
                weight /= Math.pow(totalLuck, 2);
            }
            return { id, weight };
        });

        const totalWeight = adjustedChances.reduce((sum, f) => sum + f.weight, 0);
        const roll = Math.random();
        let cumulative = 0;
        for (const f of adjustedChances) {
            cumulative += f.weight / totalWeight;
            if (roll < cumulative) {
                const fish = FISH_LIST[f.id];
                // KIỂM TRA CÁ RÁC (Giá < 10)
                if (fish.sellPrice < 10) {
                    await updateLeaderboard("trash", userId, username, guildId);
                }
                caughtFishList.push(f.id);
                tank.push(f.id);
                break;
            }
        }
    }

    // Kiểm tra gãy cần
    let rodBroken = false;
    if (rodEntry.durability <= 0) {
        inventory.splice(inventory.indexOf(rodEntry), 1);
        rodBroken = true;
    }

    // LƯU DỮ LIỆU & THIẾT LẬP COOLDOWN MỚI
    const newCooldownLimit = times > 1 ? 60000 : 10000; // >1 lần thì 1 phút, 1 lần thì 10s
    await setKey(fishInvKey, inventory);
    await setKey(tankKey, tank);
    await setKey(cooldownKey, { time: now, limit: newCooldownLimit });

    // 5. HIỂN THỊ GIAO DIỆN
    const waitEmbed = new EmbedBuilder()
        .setColor("#3498db")
        .setTitle(`🎣 ĐANG THẢ CẦN (${times} LẦN)...`)
        .setDescription(`Cần: **${rodData.name}**\nĐộ bền còn lại: **${rodEntry.durability}**\n\n*Vui lòng chờ kéo cần...*`);

    const msg = await message.reply({ embeds: [waitEmbed] });

    setTimeout(async () => {
        const resultEmbed = new EmbedBuilder()
            .setTitle(times > 1 ? `🎣 KẾT QUẢ CÂU ${times} LẦN` : `🎣 KẾT QUẢ CÂU CÁ`)
            .setColor("#2ecc71");
        let description = "";

        if (caughtFishList.length === 0) {
            resultEmbed.setColor("#e74c3c");
            description = "Thật không may, tất cả các lần thả cần đều hụt mất cá! 💨";
        } else {
            const summary = {};
            caughtFishList.forEach(id => summary[id] = (summary[id] || 0) + 1);
            
            const display = Object.entries(summary).map(([id, count]) => {
                const f = FISH_LIST[id];
                return `${f.icon} **${f.name}** x${count}`;
            }).join("\n");

            description = `Bạn đã kéo lên được:\n${display}`;
        }
        
        if (missCount > 0 && times > 1) {
            description += `\n💨 Có **${missCount}** lần cá đã thoát mất!`;
        }
        resultEmbed.setDescription(description);
        if (rodBroken) resultEmbed.addFields({ name: "⚠️ RẮC!", value: "Cần câu của bạn đã gãy sau chuyến đi này!" });
        if (times > 1) resultEmbed.setFooter({ text: "Bạn đã dùng câu hàng loạt, cooldown: 1 phút" });

        await msg.edit({ embeds: [resultEmbed] });
    }, 3000);
  }
};