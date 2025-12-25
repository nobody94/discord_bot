const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { addMoney, getIcon } = require("../utils/currency.js");
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

module.exports = {
  name: "cauca",
  aliases: ["fish", "cc"],
  description: "Đi câu cá với hệ thống độ bền, may mắn và tỉ lệ hụt.",

  async execute(message, args) {
    const userId = message.author.id;

    // 1. KIỂM TRA COOLDOWN (Hồi chiêu 15s)
    const cooldownKey = renderKey("cooldown_cauca", userId);
    const lastUsed = await getKey(cooldownKey);
    const cooldownTime = 5 * 1000;
    const now = Date.now();

    if (lastUsed && now - lastUsed < cooldownTime) {
      const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
      return message.reply(
        `${errorIcon} | Bạn đang mệt, hãy nghỉ ngơi một chút! Thử lại sau **${timeLeft} giây**.`
      );
    }

    const fishInvKey = renderKey("fish_inv", userId);
    let fishInventory = (await getKey(fishInvKey)) || [];

    // 2. TÌM CẦN CÂU VÀ MỒI
    let bestRodIndex = -1;
    let rodLuck = 0;
    let baitIndex = -1;

    for (let i = 0; i < fishInventory.length; i++) {
      const entry = fishInventory[i];
      const itemId = typeof entry === "object" ? entry.id : entry;
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

    if (bestRodIndex === -1)
      return message.reply(`${errorIcon} | Bạn không có cần câu trong túi đồ.`);
    if (baitIndex === -1)
      return message.reply(`${errorIcon} | Bạn không có mồi câu trong túi đồ.`);

    // Lưu cooldown ngay khi bắt đầu
    await setKey(cooldownKey, now);

    // 3. XỬ LÝ TIÊU THỤ ĐỒ CÂU
    const rodEntry = fishInventory[bestRodIndex];
    const rodData = FISH_SHOP_ITEMS[rodEntry.id];
    const baitId = fishInventory[baitIndex];
    const baitInfo = FISH_SHOP_ITEMS[baitId];
    const baitLuck = baitInfo.luck || 1.0;
    const totalLuck = rodLuck * baitLuck;

    // Giảm 1 độ bền cần và xóa 1 mồi
    rodEntry.durability -= 1;
    fishInventory.splice(baitIndex, 1);

    // Kiểm tra cần gãy
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
      .setDescription(
        `Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền: **${
          rodEntry.durability >= 0 ? rodEntry.durability : 0
        }/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`
      );

    const msg = await message.reply({ embeds: [waitingEmbed] });

    const countdownInterval = setInterval(async () => {
      timer--;
      if (timer <= 0) {
        clearInterval(countdownInterval);
        processFishingResult();
      } else {
        waitingEmbed.setDescription(
          `Sử dụng: **${rodData.name}** & **${baitInfo.name}**\nĐộ bền: **${
            rodEntry.durability >= 0 ? rodEntry.durability : 0
          }/${rodData.maxDurability}**\n\n⏳ Cá sẽ cắn câu sau: **${timer}s**`
        );
        await msg
          .edit({ embeds: [waitingEmbed] })
          .catch(() => clearInterval(countdownInterval));
      }
    }, 1000);

    // 5. LOGIC XỬ LÝ KẾT QUẢ (CÓ TỈ LỆ HỤT)
    async function processFishingResult() {
      // Tỉ lệ hụt mặc định 15%, giảm dần theo Luck nhưng không thấp hơn 5%
      const baseMissRate = 0.2;
      const finalMissRate = Math.max(0.05, baseMissRate - totalLuck * 0.02);

      if (Math.random() < finalMissRate) {
        const missMessages = [
          "Con cá ăn sạch mồi rồi để lại mẩu giấy: 'Mồi này hơi lạt, lần sau thêm tí muối nhé sen!'",
          "Con cá không những ăn mất mồi mà còn để lại một tờ giấy ghi: 'Mồi dở quá, lần sau mua mồi xịn hơn nhé!'",
          "Bạn vừa kéo cần lên thì thấy một con cá đang đứng trên mặt nước... vẫy tay chào tạm biệt.",
          "Cá bảo: 'Hôm nay mệt quá không muốn bị bắt, cho xin miếng mồi ăn lấy sức nhé!'",
          "Một con cá đã đớp mồi, nhìn bạn một cái đầy khinh bỉ rồi bỏ đi.",
          "Phao rung rất mạnh, nhưng hóa ra là một con cua đang nhảy múa dưới đó...",
          "Bạn nghe thấy tiếng cá thì thầm: 'Cần câu đẹp đấy, nhưng mồi thì... còn lâu nhé!'",
        ];
        const randomMsg =
          missMessages[Math.floor(Math.random() * missMessages.length)];
        // TRƯỜNG HỢP: CÂU HỤT
        const missEmbed = new EmbedBuilder()
          .setTitle("💨 HỤT MẤT RỒI!")
          .setColor("#e74c3c")
          .setDescription(randomMsg)
          .addFields({
            name: "Hậu quả",
            value: "-1 Mồi câu, -1 Độ bền cần câu.",
          });

        if (rodBroken) {
          missEmbed.addFields({
            name: "⚠️ THÔNG BÁO",
            value: `Cú kéo mạnh của cá đã làm gãy chiếc **${rodData.name}** của bạn!`,
          });
        }

        return await msg.edit({ embeds: [missEmbed] });
      }

      // TRƯỜNG HỢP: CÂU DÍNH CÁ
      const roll = Math.random();
      let cumulative = 0;
      let caughtFishId = "ca_long_tong";

      const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
        let weight = data.chance;

        if (id === "ca_map" || id === "ca_voi") {
          // Nếu là cá hiếm, áp dụng công thức nhân Luck
          weight *= totalLuck;

          // PHẠT TỈ LỆ NẾU LUCK THẤP (Dành cho cần gỗ)
          // Nếu tổng Luck dưới 2.0 (Cần gỗ + mồi thường/xịn), giảm thêm 50% tỉ lệ cá hiếm
          if (totalLuck < 2.0) {
            weight *= 0.5;
          }
        }
        return { id, weight };
      });

      const totalWeight = adjustedChances.reduce((sum, f) => sum + f.weight, 0);

      for (const f of adjustedChances) {
        cumulative += f.weight / totalWeight;
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
        .setDescription(
          `Chúc mừng! Bạn đã câu được **${fish.name}** ${fish.emoji}`
        )
        .addFields({
          name: "🍀 May mắn",
          value: `x${totalLuck.toFixed(1)}`,
          inline: true,
        })
        .setFooter({ text: "Dùng lệnh .beca để xem thành quả" });

      if (rodBroken) {
        resultEmbed.addFields({
          name: "⚠️ THÔNG BÁO",
          value: `Sau cú kéo này, chiếc **${rodData.name}** của bạn đã bị hỏng hoàn toàn!`,
        });
      }

      await msg.edit({ embeds: [resultEmbed] });
    }
  },
};
