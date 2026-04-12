const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney, checkPay } = require("../utils/currency.js");
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const {
  getCustomDate,
  MAX_LOVE_POINTS_PER_DAY,
} = require("../utils/constant.js");
const { handleTransaction } = require('../utils/transaction.js');

async function baloHandler(args, message, inventory, invKey, userId) {
  // --- LOGIC TẶNG ĐỒ (GIVE) ---
  if (args[0] === "give") {
    const target = message.mentions.users.first();
    const itemId = args[2];
    const amountToGive = parseInt(args[3]) || 1; // Lấy số lượng từ đối số thứ 4, mặc định là 1

    if (!target)
      return message.reply(
        `${errorIcon} | Vui lòng tag người muốn tặng: \`.balo give @user [ID] [số lượng]\``,
      );
    if (target.id === userId)
      return message.reply(
        `${errorIcon} | Bạn không thể tự tặng đồ cho chính mình.`,
      );
    if (!itemId)
      return message.reply(
        `${errorIcon} | Vui lòng nhập ID vật phẩm muốn tặng.`,
      );
    if (isNaN(amountToGive) || amountToGive <= 0)
      return message.reply(`${errorIcon} | Số lượng tặng không hợp lệ.`);

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
    const targetInvKey = renderKey("inventory", target.id);
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
    await handleTransaction(userId, target.id, 'balo give', `${amountToGive} x ${itemInfo.name} - ${itemId}`);

    // 3. Cập nhật lại Database cho cả 2 người
    await setKey(invKey, inventory);
    await setKey(targetInvKey, targetInventory);

    // --- BẮT ĐẦU LOGIC CẬP NHẬT CHỈ SỐ THÂN MẬT ---
    const guildId = message.guild.id;
    const coupleKey = renderKey("couple", guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    // Tìm xem hai người có phải cặp đôi trong server này không
    const coupleIndex = couplesList.findIndex(
      (c) =>
        (c.husband === userId && c.wife === target.id) ||
        (c.husband === target.id && c.wife === userId),
    );

    let loveMsg = "";
    if (coupleIndex !== -1) {
      const today = getCustomDate();

      if (couplesList[coupleIndex].lastGiftDate !== today) {
        couplesList[coupleIndex].lastGiftDate = today;
        couplesList[coupleIndex].dailyLovePoints = 0;
      }

      const item = SHOP_ITEMS[itemId] || {};
      let pointPerItem = 0;

      // Kiểm tra nếu là đồ rác (isTrash) thì trừ 5 điểm mỗi món
      if (item.isTrash) {
        pointPerItem = -5;
      } else {
        // Nếu không phải rác: lấy lovePoint định sẵn hoặc 1% giá trị (mặc định tối thiểu 1)
        pointPerItem =
          item.lovePoint !== undefined
            ? item.lovePoint
            : Math.max(Math.floor((item.price || 0) / 100), 1);
      }

      const totalLovePoints = pointPerItem * amountToGive;
      const currentDaily = couplesList[coupleIndex].dailyLovePoints || 0;

      if (totalLovePoints > 0) {
        const remainingQuota = MAX_LOVE_POINTS_PER_DAY - currentDaily;
        if (remainingQuota <= 0) {
          loveMsg = `\n⚠️ Hai bạn đã đạt giới hạn thân mật hôm nay. Hãy tặng tiếp sau 4h sáng mai!`;
        } else {
          const pointsToAdd = Math.min(totalLovePoints, remainingQuota);
          loveMsg = `\n💖 Chỉ số thân mật tăng: **+${pointsToAdd.toLocaleString()}** điểm!`;
          couplesList[coupleIndex].lovePoints =
            (couplesList[coupleIndex].lovePoints || 0) + pointsToAdd;
          couplesList[coupleIndex].dailyLovePoints = currentDaily + pointsToAdd;
          if (totalLovePoints > remainingQuota) {
            loveMsg += `\n*(Một số điểm bị bỏ qua do vượt giới hạn ngày)*`;
          }
        }
      } else if (totalLovePoints < 0) {
        loveMsg = `\n💔 Tặng đồ rác làm giảm: **${totalLovePoints}** điểm thân mật!`;
        couplesList[coupleIndex].lovePoints =
          (couplesList[coupleIndex].lovePoints || 0) + totalLovePoints;
      }
      await setKey(coupleKey, couplesList);
    }
    // --- KẾT THÚC LOGIC CẬP NHẬT CHỈ SỐ THÂN MẬT ---
    message.reply(
      `${verifyIcon} | Bạn đã tặng **${amountToGive}x ${itemInfo.icon} ${itemInfo.name}** cho **${target.username}** thành công!${loveMsg}`,
    );
    return true;
  }

  // --- LOGIC BÁN ĐỒ (SELL) ---
  if (args[0] === "sell") {
    const itemId = args[1]?.toLowerCase();
    let amountToSell = parseInt(args[2]); // Không để mặc định 1 ở đây để check logic sau

    if (!itemId) {
      message.reply(
        `${errorIcon} | Cú pháp: \`.balo sell [ID] [Số lượng]\` hoặc \`.balo sell trash\``,
      );
    }

    let totalMoraEarned = 0;
    let totalPrimoEarned = 0;
    let itemsSold = 0;
    let soldDescription = "";

    // TRƯỜNG HỢP 1: BÁN TẤT CẢ ĐỒ RÁC (.balo sell trash)
    if (itemId === "trash") {
      // Lọc những món có isTrash: true trong SHOP_ITEMS
      const trashItems = inventory.filter(
        (id) => SHOP_ITEMS[id] && SHOP_ITEMS[id].isTrash === true,
      );

      if (trashItems.length === 0) {
        return message.reply(`${errorIcon} | Túi đồ của bạn không có món đồ rác nào.`);
      }

      trashItems.forEach((id) => {
        const item = SHOP_ITEMS[id];
        if (item.currency === "primo") totalPrimoEarned += item.sellPrice;
        else totalMoraEarned += item.sellPrice;

        // Xóa món đó khỏi inventory
        const index = inventory.indexOf(id);
        if (index !== -1) inventory.splice(index, 1);
        itemsSold++;
      });

      soldDescription = `đã dọn túi và bán **${itemsSold}** món đồ rác`;
    }

    // TRƯỜNG HỢP 2: BÁN VẬT PHẨM CỤ THỂ (.balo sell [ID] [Số lượng])
    else {
      const item = SHOP_ITEMS[itemId];
      if (!item || item.sellPrice === undefined) {
        return message.reply(
          `${errorIcon} | Vật phẩm này không thể bán hoặc không tồn tại.`,
        );
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
    }

    // CẬP NHẬT DATABASE
    try {
      if (totalMoraEarned > 0) await addMoney(userId, totalMoraEarned, "mora");
      if (totalPrimoEarned > 0)
        await addMoney(userId, totalPrimoEarned, "primo");
      await setKey(invKey, inventory);

      // Tạo thông báo nhận tiền
      let moneyMsg = [];
      if (totalMoraEarned > 0)
        moneyMsg.push(
          `**${totalMoraEarned.toLocaleString()}** ${getIcon("mora")}`,
        );
      if (totalPrimoEarned > 0)
        moneyMsg.push(
          `**${totalPrimoEarned.toLocaleString()}** ${getIcon("primo")}`,
        );

      //Thêm log
      await handleTransaction(userId, userId, 'balo sell', `${soldDescription}, nhận về tổng cộng ${moneyMsg.join(" và ")}!`);

      message.reply(
        `${verifyIcon} | Bạn ${soldDescription}, nhận về tổng cộng ${moneyMsg.join(" và ")}!`,
      );
    } catch (error) {
      console.error("LỖI KHI BÁN ĐỒ:", error);
      message.reply(`${errorIcon} | Đã xảy ra lỗi khi xử lý giao dịch bán đồ.`);
    }
    return true;
  }

  // --- LOGIC MỞ RƯƠNG (OPEN) ---
  if (args[0] === "open") {
    const itemId = args[1];
    const amountToOpen = parseInt(args[2]) || 1;

    if (!itemId) return message.reply(`${errorIcon} | HD: \`.balo open [ID] [SL]\``);
    if (amountToOpen <= 0) return message.reply(`${errorIcon} | Số lượng không hợp lệ.`);

    const item = SHOP_ITEMS[itemId];
    const lootTable = BLIND_BOX_LOOT[itemId];
    if (!item || !item.canOpen || !lootTable) return message.reply(`${errorIcon} | Vật phẩm không thể mở.`);

    const countInInv = inventory.filter((id) => id === itemId).length;
    if (countInInv < amountToOpen) return message.reply(`${errorIcon} | Bạn không đủ đồ (Hiện có: ${countInInv}).`);

    // Tách Key Pity cho từng loại vật phẩm
    const pityKey = renderKey(`pity_${itemId}`, userId);
    const guaranteeKey = renderKey(`guarantee_${itemId}`, userId);
    let currentPity = (await getKey(pityKey)) || 0;
    let isGuaranteed = (await getKey(guaranteeKey)) || false;

    let totalRewards = {};
    let goldenNotes = [];

    // Lọc danh sách đồ vàng
    const goldenItems = lootTable.filter(l => l.isGolden);
    const charItems = goldenItems.filter(l => l.item.startsWith("char"));
    const lechItems = goldenItems.filter(l => l.item.startsWith("lech"));

    for (let i = 0; i < amountToOpen; i++) {
      inventory.splice(inventory.indexOf(itemId), 1);
      currentPity++;
      let selectedLoot = null;
      let triggerGold = false;

      // 1. Kiểm tra nổ vàng (Mốc 90 hoặc Random nổ sớm)
      if (currentPity >= 90) {
        triggerGold = true;
      } else {
        const totalWeight = lootTable.reduce((sum, l) => sum + (l.weight || 0), 0);
        let random = Math.random() * totalWeight;
        for (const loot of lootTable) {
          if (random < loot.weight) {
            selectedLoot = loot;
            break;
          }
          random -= loot.weight;
        }
        if (selectedLoot && selectedLoot.isGolden) triggerGold = true;
      }

      // 2. Xử lý logic nổ vàng (Bảo hiểm & 50/50)
      if (triggerGold) {
        if (isGuaranteed) {
          // CHẮC CHẮN RA CHAR (Dù nổ sớm hay nổ 90)
          selectedLoot = charItems[Math.floor(Math.random() * charItems.length)];
          goldenNotes.push(`🌟 **${selectedLoot.item}** (Nổ tại ${currentPity} - Bảo hiểm)`);
          isGuaranteed = false;
        } else {
          // QUAY 5/95 (5% ra Char, 95% ra Lệch)
          const roll = Math.random() * 100;
          if (roll < 5) {
            selectedLoot = charItems[Math.floor(Math.random() * charItems.length)];
            goldenNotes.push(`🌟 **${selectedLoot.item}** (May mắn trúng Char sớm tại ${currentPity})`);
            isGuaranteed = false;
          } else {
            selectedLoot = lechItems[Math.floor(Math.random() * lechItems.length)];
            goldenNotes.push(`💀 **${selectedLoot.item}** (Bị Lệch tại ${currentPity} - Kích hoạt bảo hiểm)`);
            isGuaranteed = true;
          }
        }
        currentPity = 0; // Luôn reset khi nổ đồ vàng
      }

      if (selectedLoot) {
        totalRewards[selectedLoot.item] = (totalRewards[selectedLoot.item] || 0) + (selectedLoot.amount || 1);
      }
    }

    // Cập nhật DB
    await setKey(pityKey, currentPity);
    await setKey(guaranteeKey, isGuaranteed);
    await setKey(invKey, inventory);

    // Trao quà
    let rewardStrings = [];
    for (const [rId, rAmount] of Object.entries(totalRewards)) {
      if (rId === "mora" || rId === "primo") {
        await addMoney(userId, rAmount, rId);
        rewardStrings.push(`**${rAmount.toLocaleString()}** ${getIcon(rId)}`);
      } else {
        for (let k = 0; k < rAmount; k++) inventory.push(rId);
        const info = SHOP_ITEMS[rId] || { name: rId, icon: "📦" };
        rewardStrings.push(`**${rAmount}x** ${info.icon} ${info.name}`);
      }
    }
    await setKey(invKey, inventory);

    let response = `✨ Mở **${amountToOpen}x ${item.icon} ${item.name}**\n🎊 Nhận: ${rewardStrings.join(", ")}\n📊 Pity: **${currentPity}/90**${isGuaranteed ? " (Đang có bảo hiểm)" : ""}`;
    if (goldenNotes.length > 0) response += `\n${goldenNotes.join("\n")}`;

    return message.reply({ content: response, allowedMentions: { repliedUser: false } });
  }

  // --- LOGIC CẤT ĐỒ VÀO TỦ (CAT) ---
  if (args[0] === "cat") {
    const subAction = args[1];
    const tudoKey = renderKey("tudo", userId);
    let tudoInv = (await getKey(tudoKey)) || [];

    if (subAction === "all") {
      const key = args[2];
      if (!key) return message.reply(`${errorIcon} | Nhập tiền tố ID (VD: \`.balo cat all char\`)`);
      const itemsToMove = inventory.filter(id => id.startsWith(key));
      if (itemsToMove.length === 0) return message.reply(`${errorIcon} | Không tìm thấy vật phẩm nào bắt đầu bằng **${key}**.`);

      itemsToMove.forEach(itemId => {
        inventory.splice(inventory.indexOf(itemId), 1);
        tudoInv.push(itemId);
      });
      await setKey(invKey, inventory);
      await setKey(tudoKey, tudoInv);
      return message.reply(`${verifyIcon} | Đã cất **${itemsToMove.length}** món vào tủ đồ.`);
    } else {
      const itemId = subAction;
      const amount = parseInt(args[2]) || 1;
      const count = inventory.filter(id => id === itemId).length;
      if (count < amount) return message.reply(`${errorIcon} | Bạn không đủ vật phẩm.`);

      for (let i = 0; i < amount; i++) {
        inventory.splice(inventory.indexOf(itemId), 1);
        tudoInv.push(itemId);
      }
      await setKey(invKey, inventory);
      await setKey(tudoKey, tudoInv);
      return message.reply(`${verifyIcon} | Đã cất **${amount}x ${itemId}** vào tủ đồ.`);
    }
  }
}

module.exports = { baloHandler };