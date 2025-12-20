const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney } = require('../utils/currency.js');
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon, bagIcon } = require('../utils/icon.js')

async function baloHandler(args, message, inventory, invKey, userId) {
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
        const amountToOpen = parseInt(args[2]) || 1;

        if (!itemId) return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm: \`.balo open [ID] [số lượng]\``);
        if (amountToOpen <= 0) return message.reply(`${errorIcon} | Số lượng không hợp lệ!`);

        const item = SHOP_ITEMS[itemId];
        const lootTable = BLIND_BOX_LOOT[itemId];

        if (!item || !item.canOpen || !lootTable) {
            return message.reply(`${errorIcon} | Vật phẩm này không thể mở!`);
        }

        // Kiểm tra số lượng thực tế trong túi
        const countInInv = inventory.filter(id => id === itemId).length;
        if (countInInv < amountToOpen) {
            return message.reply(`${errorIcon} | Bạn không đủ **${amountToOpen}x ${item.name}** (Hiện có: ${countInInv}).`);
        }

        // Lấy số Pity hiện tại từ DB
        const pityKey = renderKey("pity_counter", userId);
        let currentPity = (await getKey(pityKey)) || 0;

        let totalRewards = {};
        let goldenNotes = []; // Lưu lại thông tin nếu nổ đồ vàng

        for (let i = 0; i < amountToOpen; i++) {
            // Trừ 1 món khỏi inventory
            const idx = inventory.indexOf(itemId);
            inventory.splice(idx, 1);

            currentPity++;
            let selectedLoot = null;

            // KIỂM TRA BẢO HIỂM (PITY 90)
            if (currentPity >= 90) {
                const goldenItems = lootTable.filter(l => l.isGolden === true);
                selectedLoot = goldenItems[Math.floor(Math.random() * goldenItems.length)];
                
                goldenNotes.push(`🌟 **${selectedLoot.item}** (Nổ tại lần thứ **90**)`);
                currentPity = 0; // Reset
            } else {
                // QUAY GACHA BÌNH THƯỜNG
                const totalWeight = lootTable.reduce((sum, loot) => sum + (loot.weight || 0), 0);
                let random = Math.random() * totalWeight;

                for (const loot of lootTable) {
                    if (random < loot.weight) {
                        selectedLoot = loot;
                        break;
                    }
                    random -= loot.weight;
                }

                // Nếu may mắn nổ vàng sớm
                if (selectedLoot && selectedLoot.isGolden) {
                    goldenNotes.push(`🌟 **${selectedLoot.item}** (Nổ sớm tại lần thứ **${currentPity}**)`);
                    currentPity = 0; // Reset ngay lập tức
                }
            }

            if (selectedLoot) {
                const rKey = selectedLoot.item;
                totalRewards[rKey] = (totalRewards[rKey] || 0) + selectedLoot.amount;
            }
        }

        // Cập nhật Database (Inventory và Pity)
        await setKey(pityKey, currentPity);
        await setKey(invKey, inventory);

        // Trao quà vào DB
        let rewardStrings = [];
        for (const [rewardId, rewardAmount] of Object.entries(totalRewards)) {
            if (rewardId === "mora" || rewardId === "primo") {
                await addMoney(userId, rewardAmount, rewardId);
                rewardStrings.push(`**${rewardAmount.toLocaleString()}** ${getIcon(rewardId)}`);
            } else {
                for (let k = 0; k < rewardAmount; k++) inventory.push(rewardId);
                const rInfo = SHOP_ITEMS[rewardId] || { name: rewardId, icon: "📦" };
                rewardStrings.push(`**${rewardAmount}x** ${rInfo.icon} ${rInfo.name}`);
            }
        }
        
        // Lưu lại inventory lần cuối (sau khi đã thêm các vật phẩm trúng thưởng vào)
        await setKey(invKey, inventory);

        // Hiển thị kết quả
        let responseContent = `✨ Bạn đã mở **${amountToOpen}x ${item.icon} ${item.name}**\n🎊 Nhận được: ${rewardStrings.join(", ")}\nPity hiện tại: **${currentPity}/90**`;
        
        if (goldenNotes.length > 0) {
            responseContent += `\n${goldenNotes.join("\n")}`;
        }

        return message.reply({
            content: responseContent,
            allowedMentions: { repliedUser: false }
        });
    }
    return false;
}

module.exports = { baloHandler }