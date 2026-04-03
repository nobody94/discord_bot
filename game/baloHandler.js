const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney, checkPay } = require("../utils/currency.js");
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const {
    getCustomDate,
    MAX_LOVE_POINTS_PER_DAY,
} = require("../utils/constant.js");

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

        const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
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
                message.reply(`${errorIcon} | Túi đồ của bạn không có món đồ rác nào.`);
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
            if(item.sellPrice === 0){
                return message.reply(
                    `${errorIcon} | Vật phẩm này không thể bán.`,
                );
            }
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
                message.reply(
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

            message.reply(
                `${verifyIcon} | Bạn ${soldDescription}, nhận về tổng cộng ${moneyMsg.join(" và ")}!`,
            );
        } catch (error) {
            console.error("LỖI KHI BÁN ĐỒ:", error);
            message.reply(`${errorIcon} | Đã xảy ra lỗi khi xử lý giao dịch bán đồ.`);
        }
        return true;
    }
    // --- LOGIC MỞ ĐỒ (OPEN) ---
    if (args[0] === "open") {
        const itemId = args[1];
        const amountToOpen = parseInt(args[2]) || 1;

        if (!itemId)
            return message.reply(
                `${errorIcon} | Vui lòng nhập ID vật phẩm: \`.balo open [ID] [số lượng]\``,
            );
        if (amountToOpen <= 0)
            return message.reply(`${errorIcon} | Số lượng không hợp lệ!`);

        const item = SHOP_ITEMS[itemId];
        const lootTable = BLIND_BOX_LOOT[itemId];

        if (!item || !item.canOpen || !lootTable) {
            return message.reply(`${errorIcon} | Vật phẩm này không thể mở!`);
        }

        // Kiểm tra số lượng thực tế trong túi
        const countInInv = inventory.filter((id) => id === itemId).length;
        if (countInInv < amountToOpen) {
            return message.reply(
                `${errorIcon} | Bạn không đủ **${amountToOpen}x ${item.name}** (Hiện có: ${countInInv}).`,
            );
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
                const goldenItems = lootTable.filter((l) => l.isGolden === true);

                // Tách riêng danh sách Pokemon và các đồ vàng khác
                const pokemonItems = goldenItems.filter(l => l.item.startsWith("pokemon"));
                const otherGoldenItems = goldenItems.filter(l => !l.item.startsWith("pokemon"));

                const randomRoll = Math.random() * 100; // Quay số từ 0 - 100

                if (randomRoll < 5) {
                    // 3% tỉ lệ rơi vào nhóm Pokemon
                    const totalPokeWeight = pokemonItems.reduce((sum, l) => sum + (l.weight || 1), 0);
                    let randPoke = Math.random() * totalPokeWeight;
                    for (const loot of pokemonItems) {
                        if (randPoke < (loot.weight || 1)) {
                            selectedLoot = loot;
                            break;
                        }
                        randPoke -= (loot.weight || 1);
                    }
                } else {
                    // 97% tỉ lệ rơi vào các đồ vàng khác (ví dụ: kim_cuong)
                    const totalOtherWeight = otherGoldenItems.reduce((sum, l) => sum + (l.weight || 1), 0);
                    let randOther = Math.random() * totalOtherWeight;
                    for (const loot of otherGoldenItems) {
                        if (randOther < (loot.weight || 1)) {
                            selectedLoot = loot;
                            break;
                        }
                        randOther -= (loot.weight || 1);
                    }
                }

                goldenNotes.push(`🌟 **${selectedLoot.item}** (Nổ tại lần thứ **90**)`);
                currentPity = 0;
            } else {
                // QUAY GACHA BÌNH THƯỜNG
                const totalWeight = lootTable.reduce(
                    (sum, loot) => sum + (loot.weight || 0),
                    0,
                );
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
                    goldenNotes.push(
                        `🌟 **${selectedLoot.item}** (Nổ sớm tại lần thứ **${currentPity}**)`,
                    );
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
                rewardStrings.push(
                    `**${rewardAmount.toLocaleString()}** ${getIcon(rewardId)}`,
                );
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

        message.reply({
            content: responseContent,
            allowedMentions: { repliedUser: false },
        });
        return true;
    }
    return false;
}

module.exports = { baloHandler };