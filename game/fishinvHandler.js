const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney } = require("../utils/currency.js");
const { FISH_SHOP_ITEMS } = require("../utils/fish.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

async function fishInvHandler(args, message, inventory, invKey, userId) {
  const action = args[0]?.toLowerCase();

  // --- LOGIC TẶNG ĐỒ (GIVE) ---
  if (action === "give") {
    const target = message.mentions.users.first();
    const itemId = args[2]?.toLowerCase();
    const amountToGive = parseInt(args[3]) || 1;

    if (!target) return message.reply(`${errorIcon} | Cú pháp: \`.inv give @user [ID] [Số lượng]\``);
    if (target.id === userId) return message.reply(`${errorIcon} | Bạn không thể tự tặng cho mình.`);
    if (!itemId) return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm cần tặng.`);

    const itemData = FISH_SHOP_ITEMS[itemId];
    if (!itemData) return message.reply(`${errorIcon} | Vật phẩm không tồn tại.`);

    // Lọc danh sách vật phẩm người dùng đang có theo ID (Xử lý cả String và Object)
    const userItems = inventory.filter(entry => 
      (typeof entry === "object" ? entry.id : entry) === itemId
    );

    if (userItems.length < amountToGive) {
      return message.reply(`${errorIcon} | Bạn không đủ số lượng **${itemData.name}** để tặng.`);
    }

    const targetInvKey = renderKey("fish_inv", target.id);
    let targetInventory = (await getKey(targetInvKey)) || [];

    // Thực hiện chuyển vật phẩm
    for (let i = 0; i < amountToGive; i++) {
      // Tìm vị trí vật phẩm (Hỗ trợ tìm Object cho cần câu)
      const index = inventory.findIndex(entry => 
        (typeof entry === "object" ? entry.id : entry) === itemId
      );

      if (index !== -1) {
        const itemToTransfer = inventory[index];
        targetInventory.push(itemToTransfer); // Chuyển nguyên Object (bao gồm độ bền)
        inventory.splice(index, 1); // Xóa khỏi túi người tặng
      }
    }

    await setKey(invKey, inventory);
    await setKey(targetInvKey, targetInventory);

    return message.reply(`${verifyIcon} | Bạn đã tặng **${amountToGive}** ${itemData.icon} **${itemData.name}** cho **${target.username}** thành công!`);
  }

  // --- LOGIC BÁN ĐỒ (SELL) ---
  if (action === "sell") {
    const itemId = args[1]?.toLowerCase();
    let amountToSell = parseInt(args[2]) || 1;

    if (!itemId) return message.reply(`${errorIcon} | Cú pháp: \`.inv sell [ID] [Số lượng]\``);

    const itemData = FISH_SHOP_ITEMS[itemId];
    if (!itemData) return message.reply(`${errorIcon} | Vật phẩm không tồn tại.`);

    const isRod = itemId.includes("cancau");
    const userItems = inventory.filter(entry => 
      (typeof entry === "object" ? entry.id : entry) === itemId
    );

    if (userItems.length < amountToSell) {
      return message.reply(`${errorIcon} | Bạn không đủ số lượng để bán.`);
    }

    let totalMoraEarned = 0;
    for (let i = 0; i < amountToSell; i++) {
      const index = inventory.findIndex(entry => 
        (typeof entry === "object" ? entry.id : entry) === itemId
      );
      
      const itemEntry = inventory[index];
      let sellPrice = itemData.price;

      // Tính giá cần câu theo độ bền
      if (isRod && typeof itemEntry === "object") {
        const durabilityFactor = itemEntry.durability / itemData.maxDurability;
        sellPrice = Math.floor(sellPrice * durabilityFactor);
        const floorPrice = Math.floor(itemData.price * 0.1); // Giá sàn 10%
        if (sellPrice < floorPrice) sellPrice = floorPrice;
      }

      totalMoraEarned += sellPrice;
      inventory.splice(index, 1);
    }

    await addMoney(userId, totalMoraEarned, itemData.currency || "mora");
    await setKey(invKey, inventory);

    return message.reply(`${verifyIcon} | Bạn đã bán **${amountToSell}** ${itemData.name}, nhận được **${totalMoraEarned.toLocaleString()}** ${getIcon(itemData.currency || "mora")}.`);
  }

  return false;
}

module.exports = { fishInvHandler };