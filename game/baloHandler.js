const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney } = require('../utils/currency.js');
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon, bagIcon } = require('../utils/icon.js')

async function baloHandler(args, message, inventory,invKey) {
    // --- LOGIC TẶNG ĐỒ (GIVE) ---
    if (args[0] === "give") {
        const target = message.mentions.users.first();
        const itemId = args[2];

        if (!target)
            return message.reply(
                `${errorIcon} | Vui lòng tag người muốn tặng: .balo give @user [ID_vật_phẩm]`
            );
        if (target.id === userId)
            return message.reply(`${errorIcon} | Bạn không thể tự tặng đồ cho chính mình.`);
        if (!itemId)
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn tặng.`);

        // Kiểm tra vật phẩm có trong túi đồ không
        const itemIndex = inventory.indexOf(itemId);
        if (itemIndex === -1) {
            return message.reply(
                `${errorIcon} | Bạn không sở hữu vật phẩm có ID \`${itemId}\` trong túi đồ.`
            );
        }

        // Thực hiện chuyển đồ
        const targetInvKey = renderKey("inventory", target.id);
        let targetInventory = (await getKey(targetInvKey)) || [];

        // Xóa 1 món từ người tặng và thêm vào người nhận
        inventory.splice(itemIndex, 1);
        targetInventory.push(itemId);

        // Cập nhật lại Database cho cả 2 người
        await setKey(invKey, inventory);
        await setKey(targetInvKey, targetInventory);

        const item = SHOP_ITEMS[itemId] || {
            name: itemId,
            icon: "<:box:1451465056612253779>",
        };
        message.reply(
            `${verifyIcon} | Bạn đã tặng **${item.icon} ${item.name}** cho **${target.username}** thành công!`
        );
        return true;
    }

    // --- LOGIC BÁN ĐỒ (SELL) ---
    if (args[0] === "sell") {
        const itemId = args[1]; // ID vật phẩm người dùng nhập
        const amountToSell = parseInt(args[2]) || 1; // Mặc định bán 1 món

        if (!itemId) {
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn bán: \`.balo sell [ID] [số lượng]\``);
        }

        const item = SHOP_ITEMS[itemId];
        if (!item || !item.sellPrice || item.sellPrice <= 0) {
            return message.reply(`${errorIcon} | Vật phẩm này không có giá trị bán hoặc không tồn tại.`);
        }

        // Đếm số lượng vật phẩm này đang có trong kho
        const currentItems = inventory.filter(id => id === itemId);
        if (currentItems.length < amountToSell) {
            return message.reply(`${errorIcon} | Bạn không đủ số lượng **${item.name}** để bán (Hiện có: ${currentItems.length}).`);
        }

        // 1. Thực hiện trừ vật phẩm khỏi mảng inventory
        for (let i = 0; i < amountToSell; i++) {
            const index = inventory.indexOf(itemId);
            if (index !== -1) {
                inventory.splice(index, 1);
            }
        }

        // 2. Tính toán tiền nhận được và cộng vào DB
        const totalMoney = item.sellPrice * amountToSell;
        const currencyType = item.currency || 'mora'; // Mặc định là mora nếu không có

        // Giả sử bạn lưu tiền chung trong một Object user_data hoặc theo Key riêng
        // Ở đây mình ví dụ cộng trực tiếp vào thuộc tính của User (phổ biến trong bot của bạn)
        const userMoneyKey = renderKey(currencyType, userId);
        const currentBalance = (await getKey(userMoneyKey)) || 0;

        // Cập nhật lại Database
        await setKey(invKey, inventory); // Lưu lại túi đồ
        await setKey(userMoneyKey, currentBalance + totalMoney); // Lưu lại tiền

        message.reply(
            `${verifyIcon} | Bạn đã bán thành công **${amountToSell}x ${item.icon} ${item.name}** và nhận được **${totalMoney.toLocaleString()}** ${getIcon(currencyType)}!`
        );
        return true;
    }
    // --- LOGIC MỞ ĐỒ (OPEN) ---
    if (args[0] === "open") {
        const itemId = args[1];
        const amountToOpen = parseInt(args[2]) || 1; // Mặc định mở 1 món

        if (!itemId) {
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn mở: \`.balo open [ID] [số lượng]\``);
        }

        const item = SHOP_ITEMS[itemId];
        // Kiểm tra vật phẩm có tồn tại và có thể mở không
        if (!item || !item.canOpen) {
            return message.reply(`${errorIcon} | Vật phẩm này không thể mở!`);
        }

        // Kiểm tra số lượng trong túi đồ
        const currentItems = inventory.filter(id => id === itemId);
        if (currentItems.length < amountToOpen) {
            return message.reply(`${errorIcon} | Bạn không đủ số lượng **${item.name}** để mở (Hiện có: ${currentItems.length}).`);
        }

        const lootTable = BLIND_BOX_LOOT[itemId];
        if (!lootTable) {
            return message.reply(`${errorIcon} | Chưa cấu hình quà tặng cho vật phẩm này!`);
        }

        let totalRewards = {}; // Lưu trữ tổng quà nhận được

        // 1. Thực hiện trừ vật phẩm khỏi túi đồ và quay gacha
        for (let i = 0; i < amountToOpen; i++) {
            const index = inventory.indexOf(itemId);
            if (index === -1) break; // Bảo vệ nếu số lượng thay đổi trong vòng lặp

            inventory.splice(index, 1);

            // Tính tổng trọng số
            const totalWeight = lootTable.reduce((sum, loot) => sum + (loot.weight || 0), 0);

            // KIỂM TRA 1: Nếu tổng weight bằng 0 hoặc nhỏ hơn
            if (totalWeight <= 0) {
                return message.reply(`${errorIcon} | Lỗi: Vật phẩm này chưa được thiết lập tỉ lệ quà tặng!`);
            }

            let random = Math.random() * totalWeight;
            let selectedLoot = null;

            for (const loot of lootTable) {
                if (random < loot.weight) {
                    selectedLoot = loot;
                    break;
                }
                random -= loot.weight;
            }

            // KIỂM TRA 2: Sửa lỗi (reading 'item')
            if (selectedLoot && selectedLoot.item) {
                const rewardKey = selectedLoot.item;
                if (!totalRewards[rewardKey]) {
                    totalRewards[rewardKey] = 0;
                }
                totalRewards[rewardKey] += selectedLoot.amount;
            } else {
                // Nếu không may rơi vào trường hợp null, hoàn trả vật phẩm hoặc báo lỗi
                console.error(`Lỗi Gacha: Không tìm thấy selectedLoot cho vật phẩm ${itemId}`);
            }
        }

        // 2. Trao quà vào DB
        let rewardStrings = [];

        for (const [rewardId, rewardAmount] of Object.entries(totalRewards)) {
            // Nếu quà là tiền tệ (mora/primo)
            if (rewardId === "mora" || rewardId === "primo") {
                await addMoney(userId, rewardAmount, rewardId);
                rewardStrings.push(`**${rewardAmount.toLocaleString()}** ${getIcon(rewardId)}`);
            } else {
                // Nếu quà là vật phẩm khác
                for (let k = 0; k < rewardAmount; k++) {
                    inventory.push(rewardId);
                }
                const rewardItemInfo = SHOP_ITEMS[rewardId] || { name: rewardId, icon: bagIcon };
                rewardStrings.push(`**${rewardAmount}x** ${rewardItemInfo.icon} ${rewardItemInfo.name}`);
            }
        }

        // 3. Lưu lại túi đồ sau khi mở và thêm quà
        await setKey(invKey, inventory);

        message.reply({
            content: `✨ Bạn đã mở **${amountToOpen}x ${item.icon} ${item.name}** và nhận được:\n🎊 ${rewardStrings.join(", ")}`,
            allowedMentions: { repliedUser: false }
        });
        return true;
    }
    return false;
}

module.exports = { baloHandler }