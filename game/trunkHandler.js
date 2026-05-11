const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney, checkPay } = require("../utils/currency.js");
const { SHOP_ITEMS, type, gifImages } = require("../utils/blackmarket.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { updateHP, getHealthStatus } = require("../utils/health.js");
const { checkCooldown,getRemaining,getCountdown } = require("../utils/cooldown");
const { handleTransaction } = require("../utils/transaction.js");

async function trunkHandler(args, message, inventory, invKey, userId) {
  if (args[0] === "give") {
    const target = message.mentions.users.first();
    const itemId = args[2];
    const amountToGive = parseInt(args[3]) || 1;

    if (!target)
      return message.reply(
        `${errorIcon} | Vui lòng tag người muốn tặng: \`.trunk give @user [ID] [số lượng]\``,
      );
    if (target.id === userId)
      return message.reply(
        `${errorIcon} | Bạn không thể tự tặng đồ cho chính mình.`,
      );
    if (!itemId)
      return message.reply(
        `${errorIcon} | Vui lòng nhập ID vật phẩm muốn tặng.`,
      );
    if (isNaN(amountToGive) || amountToGive <= 0) {
      return message.reply(`${errorIcon} | Số lượng tặng không hợp lệ.`);
    }

    // 1. Kiểm tra số lượng vật phẩm có trong túi đồ
    const userItems = inventory.filter((id) => id === itemId);
    if (userItems.length < amountToGive) {
      return message.reply(
        `${errorIcon} | Bạn không đủ số lượng **${itemId}** để tặng (Hiện có: ${userItems.length}).`,
      );
    }

    //kiểm tra nợ và biên bản
    const isBlocked = await checkPay(message, userId);
    if (isBlocked) return;

    // 2. Thực hiện chuyển đồ
    const targetInvKey = renderKey("trunk", target.id);
    let targetInventory = (await getKey(targetInvKey)) || [];

    // Xóa số lượng món đồ từ người tặng và thêm vào người nhận
    for (let i = 0; i < amountToGive; i++) {
      const index = inventory.indexOf(itemId);
      if (index !== -1) {
        inventory.splice(index, 1);
        targetInventory.push(itemId);
      }
    }
    const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
    //Thêm log
    await handleTransaction(
      userId,
      target.id,
      "trunk give",
      `${amountToGive} x ${itemInfo.name} - ${itemId}`,
    );

    // 3. Cập nhật lại Database cho cả 2 người
    await setKey(invKey, inventory);
    await setKey(targetInvKey, targetInventory);

    message.reply(
      `${verifyIcon} | Bạn đã tặng **${amountToGive}x ${itemInfo.icon} ${itemInfo.name}** cho **${target.username}** thành công!`,
    );
    return true;
  }

  // --- LOGIC BÁN ĐỒ (SELL) ---
  if (args[0] === "sell") {
    const itemId = args[1]?.toLowerCase();
    let amountToSell = parseInt(args[2]); // Không để mặc định 1 ở đây để check logic sau

    if (!itemId) {
      message.reply(`${errorIcon} | Cú pháp: \`.trunk sell [ID] [Số lượng]\``);
    }

    let totalMoraEarned = 0;
    let totalPrimoEarned = 0;
    let itemsSold = 0;
    let soldDescription = "";

    // TRƯỜNG HỢP 2: BÁN VẬT PHẨM CỤ THỂ (.balo sell [ID] [Số lượng])
    const item = SHOP_ITEMS[itemId];
    if (!item) {
      return message.reply(`${errorIcon} | Vật phẩm này không tồn tại.`);
    }

    if (item.sellPrice === 0) {
      return message.reply(`${errorIcon} | Vật phẩm này không thể bán.`);
    }

    // Đếm xem thực tế có bao nhiêu món này
    const countInInv = inventory.filter((id) => id === itemId).length;

    // Nếu không nhập số lượng thì bán 1, nếu nhập 'all' thì bán hết món đó
    if (args[2]?.toLowerCase() === "all") amountToSell = countInInv;
    else amountToSell = amountToSell || 1;

    if (amountToSell <= 0)
      return message.reply(`${errorIcon} | Số lượng bán không hợp lệ.`);
    if (countInInv < amountToSell) {
      return message.reply(
        `${errorIcon} | Bạn chỉ có **${countInInv}x** ${item.name}, không đủ để bán **${amountToSell}**.`,
      );
    }

    // Thực hiện xóa và tính tiền
    for (let i = 0; i < amountToSell; i++) {
      const idx = inventory.indexOf(itemId);
      inventory.splice(idx, 1);

      if (item.currency === "primo") totalPrimoEarned += item.sellPrice;
      else totalMoraEarned += item.sellPrice;
      itemsSold++;
    }

    soldDescription = `đã bán **${itemsSold}x** ${item.icon} **${item.name}**`;

    // CẬP NHẬT DATABASE
    try {
      if (totalMoraEarned > 0) {
        await addMoney(userId, totalMoraEarned, "mora");
      }
      if (totalPrimoEarned > 0) {
        await addMoney(userId, totalPrimoEarned, "primo");
      }
      await setKey(invKey, inventory);

      // Tạo thông báo nhận tiền
      let moneyMsg = [];
      let tranMsg = [];
      if (totalMoraEarned > 0) {
        moneyMsg.push(
          `**${totalMoraEarned.toLocaleString()}** ${getIcon("mora")}`,
        );
        tranMsg.push(`**${totalMoraEarned.toLocaleString()}** mora}`);
      }

      if (totalPrimoEarned > 0) {
        moneyMsg.push(
          `**${totalPrimoEarned.toLocaleString()}** ${getIcon("primo")}`,
        );
        tranMsg.push(`**${totalPrimoEarned.toLocaleString()}** primo}`);
      }

      //Thêm log
      await handleTransaction(
        userId,
        userId,
        "trunk sell",
        `${soldDescription}, nhận về tổng cộng ${tranMsg.join(" và ")}!`,
      );

      message.reply(
        `${verifyIcon} | Bạn ${soldDescription}, nhận về tổng cộng ${moneyMsg.join(" và ")}!`,
      );
    } catch (error) {
      console.error("LỖI KHI BÁN ĐỒ:", error);
      message.reply(`${errorIcon} | Đã xảy ra lỗi khi xử lý giao dịch bán đồ.`);
    }
    return true;
  }

  // --- LOGIC NÉM ĐỒ (THROW) ---
  if (args[0] === "throw") {
    const guildId = message.guild.id;
    const battleKey = renderKey("battle", guildId);
    let lobby = (await getKey(battleKey)) || [];
    const timeCountdown = 30;

    const target = message.mentions.users.first();

    if (!lobby.includes(userId)) {
      return message.reply(
        `${errorIcon} | Bạn chưa tham gia trận đấu\` \n.battle join để tham gia`,
      );
    }

    if (!target) {
      return message.reply(`${errorIcon} | Bạn phải tag tên người chơi`);
    }

    if (!lobby.includes(target.id)) {
      return message.reply(
        `${errorIcon} | <@${target.id}> chưa tham gia trận đấu\` \n.battle invite để mời <@${target.id}> tham gia`,
      );
    }

    const currentHP = (await getKey(renderKey("health", target.id))) ?? 100;

    if(currentHP<=0){
        return message.reply(
        `${errorIcon} | <@${target.id}> đang bị gục hãy đợi <@${target.id}> hồi phục rồi ném tiếp`,
      );
    }
   
    const healthInfo = getHealthStatus(currentHP);

        // Nếu đối phương đang bị chấn thương (muteTime > 0), họ có "khiên" bảo vệ
    if (healthInfo.muteTime > 0) {       
        const shieldCooldown = (healthInfo.muteTime / 1000) + 60;
        const shieldRemaining = getRemaining(target.id, "trunk_shield", shieldCooldown); 
        // Lưu ý: Bạn nên dùng một key riêng như "trunk_shield" gắn với target.id

        if (shieldRemaining > 0) {
            const shieldTag = getCountdown(target.id, "trunk_shield", shieldCooldown);
            return message.reply(`🛡️ | <@${target.id}> đang trong trạng thái hồi phục (có khiên bảo vệ), quay lại sau ${shieldTag}`)
                .then((msg) => setTimeout(() => msg.delete().catch(() => null), 3000));
        }
    }

    const personalRemaining = getRemaining(userId, "trunk_throw", timeCountdown);
    if (personalRemaining > 0) {
        const throwTag = getCountdown(userId, "trunk_throw", timeCountdown);
        return message.reply(`⏳ | Bạn cần nghỉ ngơi một chút, quay lại sau ${throwTag}`)
            .then((msg) => setTimeout(() => msg.delete().catch(() => null), 3000));
    }

    const itemId = args[2];
    const amount = parseInt(args[3]) || 1;
    if (!target) {
      return message.reply(
        `${errorIcon} | Vui lòng tag người muốn ném: \`.trunk throw @user [ID] [số lượng]\``,
      );
    }

    if (target.id === userId) {
      return message.reply(`${errorIcon} | Bạn không thể tự ném chính mình.`);
    }

    if (!itemId) {
      return message.reply(
        `${errorIcon} | Vui lòng nhập ID vật phẩm muốn ném.`,
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        `${errorIcon} | Số lượng vật phẩm muốn ném không hợp lệ.`,
      );
    }

    const item = SHOP_ITEMS[itemId];
    if (!item) {
      return message.reply(`${errorIcon} | Vật phẩm này không tồn tại.`);
    }

    if (item.type != type.damage) {
      return message.reply(
        `${errorIcon} | ${item.name} không phải vật phẩm dùng để ném`,
      );
    }

    // Kiểm tra vật phẩm trong túi đồ
    const userItems = inventory.filter((id) => id === itemId);
    if (userItems.length < amount) {
      return message.reply(
        `${errorIcon} | Bạn không đủ số lượng **${itemId}** để ném (Hiện có: ${userItems.length}).`,
      );
    }

    if (item.maxAmount && amount > item.maxAmount) {
      return message.reply(
        `${errorIcon} | Số lượng ${item.name} dùng để ném không được quá ${item.maxAmount} trong 1 lần`,
      );
    }

    let countToRemove = amount;
    inventory = inventory.filter((id) => {
      if (id === itemId && countToRemove > 0) {
        countToRemove--;
        return false;
      }
      return true;
    });
    await setKey(invKey, inventory);

    checkCooldown(userId, "trunk_throw", timeCountdown);

    // 3. Khởi tạo các biến thống kê
    let hitCount = 0;
    let missCount = 0;
    let reflectCount = 0;
    let totalDamageToTarget = 0;
    let totalDamageToSelf = 0;

    const missRate = 0.15; // 15% né
    const reflectRate = 0.1; // 10% phản đòn

    // 4. Vòng lặp tính toán cho TỪNG vật phẩm
    for (let i = 0; i < amount; i++) {
      const roll = Math.random();
      const damage =
        Math.floor(Math.random() * (item.maxDmg - item.minDmg + 1)) +
        item.minDmg;

      if (roll < missRate) {
        // Hụt
        missCount++;
      } else if (roll < missRate + reflectRate) {
        // Phản đòn
        reflectCount++;
        totalDamageToSelf += damage;
      } else {
        // Trúng
        hitCount++;
        totalDamageToTarget += damage;
      }
    }

    // 5. Cập nhật HP cho cả hai (nếu có sát thương)
    let finalTargetHP = (await getKey(renderKey("health", target.id))) ?? 100;
    let finalSelfHP = (await getKey(renderKey("health", userId))) ?? 100;

    if (totalDamageToTarget > 0) {
      finalTargetHP = await updateHP(message, target.id, totalDamageToTarget);
        const newHealthInfo = getHealthStatus(finalTargetHP);
        if (newHealthInfo.muteTime > 0) {
            const newShieldTime = (newHealthInfo.muteTime / 1000) + 30;
            // Kích hoạt khiên cho người bị ném
            checkCooldown(target.id, "trunk_shield", newShieldTime); 
        }
    }

    if (totalDamageToSelf > 0) {
      finalSelfHP = await updateHP(message, userId, totalDamageToSelf);
    }

    // 6. Tổng kết kết quả
    const targetStatus = getHealthStatus(finalTargetHP);
    const selfStatus = getHealthStatus(finalSelfHP);

    const targetInfo = getHealthStatus(finalTargetHP);
    const selfInfo = getHealthStatus(finalSelfHP);

    let resultMsg = `— **<@${target.id}>**: ${finalTargetHP}/100 [${targetInfo.status}]\n`;

    if (targetInfo.muteTime > 0) {
      resultMsg += `> *Đối phương đã bị choáng và không thể chat trong ${targetInfo.muteTime / 60000} phút.*\n`;
    }

    if (totalDamageToSelf > 0) {
      resultMsg += `— **Bản thân**: ${finalSelfHP}/100 [${selfInfo.status}]\n`;
      if (selfInfo.muteTime > 0) {
        resultMsg += `> *Bạn cũng bị chấn thương và bị cấm chat trong ${selfInfo.muteTime / 60000} phút!*`;
      }
    }

    let images = [];

    if (gifImages[itemId]) {
      images = gifImages[itemId];
    }

    if (images.length == 0) {
      images = gifImages["default"];
    }

    let gifUrl = images[Math.floor(Math.random() * images.length)];

    const embed = new EmbedBuilder()
      .setTitle(
        `🎯 Bạn đã ném **${amount}x** ${item.icon} **${item.name}** về phía **${target.username}**!`,
      )
      .setColor(0xe74c3c)
      .addFields(
        { name: "✅ Trúng", value: `${hitCount}`, inline: true },
        { name: "💨 Trượt", value: `${missCount}`, inline: true },
        { name: "💥 Phản dmg", value: `${reflectCount}`, inline: true },
        { name: "📊 Kết quả", value: `${resultMsg}`, inline: true },
      )
      .setImage(gifUrl)
      .setFooter({ text: "Sử dụng vật phẩm hồi phục để tăng HP!" });

    message.reply({ embeds: [embed] });
    return true;
  }

  if (args[0] === "use") {
    const guildId = message.guild.id;
    const battleKey = renderKey("battle", guildId);
    let lobby = (await getKey(battleKey)) || [];
    const targetMention = message.mentions.users.first();
    const target = targetMention || message.author;
    const maxItem = 3;

    if (!lobby.includes(userId)) {
      return message.reply(
        `${errorIcon} | Bạn chưa tham gia trận đấu\` \n.battle join để tham gia`,
      );
    }

    if (target.id != message.author.id && !lobby.includes(target.id)) {
      return message.reply(
        `${errorIcon} | <@${target.id}> chưa tham gia trận đấu\` \n.battle invite để mời <@${target.id}> tham gia`,
      );
    }   

    if (checkCooldown(message.author.id, "trunk_use", 30)) {
      return message
        .reply(
          "⏳ | Bạn đang thao tác quá nhanh! Vui lòng đợi vài giây để tiếp tục sử dụng.",
        )
        .then((msg) => setTimeout(() => msg.delete().catch(() => null), 2000));
    }

    const itemId = targetMention ? args[2] : args[1];
    let amountStr = targetMention ? args[3] : args[2];
    const amount = parseInt(amountStr) || 1;
    const isSelf = target.id === userId;

    if (!itemId) {
      message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn sử dụng.`);
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        `${errorIcon} | Số lượng vật phẩm không hợp lệ.`,
      );
    }

    if(amount > maxItem){
        return message.reply(
        `${errorIcon} | Số lượng vật phẩm không được quá ${maxItem}.`,
      );
    }

    const item = SHOP_ITEMS[itemId];

    if (!item) {
      return message.reply(`${errorIcon} | Vật phẩm này không tồn tại.`);
    }

    if (item.type != type.healing && item.type != type.revive) {
      return message.reply(
        `${errorIcon} | ${item.name} không phải vật phẩm dùng để chữa trị`,
      );
    }

    const userItemsCount = inventory.filter((id) => id === itemId).length;

    if (userItemsCount < amount) {
      return message.reply(
        `${errorIcon} | Bạn không đủ số lượng **${item.name}** (Hiện có: ${userItemsCount}).`,
      );
    }

    if (item.type == type.revive && isSelf) {
      return message.reply(
        `${errorIcon} | Bạn không thể tự hồi sinh chính mình`,
      );
    }

    const targetHPKey = renderKey("health", target.id);
    let targetHP = (await getKey(targetHPKey)) ?? 100;

    if (targetHP >= 100) {
      return message.reply(
        `${errorIcon} | **${target.username}** đang ở trạng thái sức khỏe tốt nhất (100 HP).`,
      );
    }

    if (item.type == type.revive && targetHP > 0) {
      return message.reply(
        `${errorIcon} | **${target.username}** chưa bị gục ngã không thể hồi sinh.`,
      );
    }

    let totalHeal = 0;
    const min = isSelf ? item.minHeal : item.minHealOther;
    const max = isSelf ? item.maxHeal : item.maxHealOther;

    for (let i = 0; i < amount; i++) {
      totalHeal += Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const oldHP = targetHP;
    targetHP = Math.min(100, targetHP + totalHeal);
    const actualHeal = targetHP - oldHP;

    let removed = 0;
    inventory = inventory.filter((id) => {
      if (id === itemId && removed < amount) {
        removed++;
        return false;
      }
      return true;
    });
    await setKey(invKey, inventory);
    await setKey(targetHPKey, targetHP);

    let muteNotice = "";
    const healthInfo = getHealthStatus(targetHP);

    if (targetHP > 80) {
      try {
        const member = await message.guild.members.fetch(target.id);
        if (member && member.communicationDisabledUntilTimestamp > Date.now()) {
          await member.timeout(null);
          muteNotice = `\n✨ **<@${target.id}>** đã tỉnh táo lại và có thể chat!`;
        }
      } catch (e) {}
    }

    const targetName = isSelf ? "bản thân" : `**<@${target.id}>**`;
    message.reply(
      `💉 Bạn đã sử dụng **${amount}x ${item.icon} ${item.name}** cho ${targetName}.\n` +
        `💖 Tổng hồi phục: **+${actualHeal} HP**\n` +
        `🩺 Trạng thái: ${healthInfo.status}${muteNotice}`,
    );

    return true;
  }
}

module.exports = { trunkHandler };
