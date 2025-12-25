const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney } = require("../utils/currency.js");
const { FISH_SHOP_ITEMS } = require("../utils/fish.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

async function fishInvHandler(args, message, inventory, invKey, userId) {
  // --- LOGIC TẶNG ĐỒ CÂU (GIVE) ---
  if (args[0] === "give") {
    const target = message.mentions.users.first();
    const itemId = args[2];
    const amountToGive = parseInt(args[3]) || 1;

    if (!target)
      message.reply(
        `${errorIcon} | Cú pháp: \`.inv give @user [ID] [Số lượng]\``
      );
    if (target.id === userId)
      message.reply(`${errorIcon} | Bạn không thể tự tặng cho mình.`);

    const userItems = inventory.filter((id) => id === itemId);
    if (userItems.length < amountToGive) {
      message.reply(`${errorIcon} | Bạn không đủ số lượng để tặng.`);
    }

    const targetInvKey = renderKey("fish_inv", target.id);
    let targetInventory = (await getKey(targetInvKey)) || [];

    for (let i = 0; i < amountToGive; i++) {
      const index = inventory.indexOf(itemId);
      if (index !== -1) {
        inventory.splice(index, 1);
        targetInventory.push(itemId);
      }
    }

    await setKey(invKey, inventory);
    await setKey(targetInvKey, targetInventory);
    message.reply(
      `${verifyIcon} | Đã tặng đồ câu thành công cho **${target.username}**!`
    );
    return true;
  }

  // --- LOGIC BÁN ĐỒ CÂU (SELL) ---
  if (args[0] === "sell") {
    const itemId = args[1]?.toLowerCase();
    let amountToSell = args[2];

    if (!itemId)
      return message.reply(
        `${errorIcon} | Cú pháp: \`.inv sell <ID> <SL/all>\``
      );

    const itemData = FISH_SHOP_ITEMS[itemId];
    if (!itemData)
      return message.reply(`${errorIcon} | Vật phẩm không tồn tại.`);

    const isRod = itemId.includes("cancau");
    let totalMoraEarned = 0;
    let soldCount = 0;

    // Tìm tất cả các item có ID này
    const itemsToSell = inventory.filter(
      (entry) => (typeof entry === "object" ? entry.id : entry) === itemId
    );

    if (amountToSell?.toLowerCase() === "all") {
      amountToSell = itemsToSell.length;
    } else {
      amountToSell = parseInt(amountToSell) || 1;
    }

    if (itemsToSell.length < amountToSell || amountToSell <= 0) {
      return message.reply(
        `${errorIcon} | Bạn không đủ số lượng vật phẩm này để bán.`
      );
    }

    for (let i = 0; i < amountToSell; i++) {
      const index = inventory.findIndex(
        (entry) => (typeof entry === "object" ? entry.id : entry) === itemId
      );
      const itemEntry = inventory[index];

      let sellPrice = itemData.price; // Giá bán cơ bản = giá mua

      // Nếu là cần câu, tính giá dựa trên độ bền: (Độ bền hiện tại / Độ bền tối đa) * Giá bán cơ bản
      if (isRod && typeof itemEntry === "object") {
        const durabilityFactor = itemEntry.durability / itemData.maxDurability;
        sellPrice = Math.floor(sellPrice * durabilityFactor);

        const floorPrice = Math.floor(itemData.price * 0.01);
        if (sellPrice < floorPrice) sellPrice = floorPrice;
      }

      totalMoraEarned += sellPrice;
      inventory.splice(index, 1);
      soldCount++;
    }

    await addMoney(userId, totalMoraEarned, itemData.currency || "mora");
    await setKey(invKey, inventory);

    return message.reply(
      `${verifyIcon} | Bạn đã bán **${soldCount}x** ${itemData.icon} **${
        itemData.name
      }** và nhận lại **${totalMoraEarned.toLocaleString()}** ${getIcon(
        itemData.currency || "mora"
      )}!\n*(Lưu ý: Giá cần câu giảm theo độ bền)*`
    );
  }

  return false;
}

module.exports = { fishInvHandler };
