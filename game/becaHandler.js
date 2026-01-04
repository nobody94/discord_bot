const { setKey, getKey, renderKey } = require("../utils/db");
const { addMoney, getIcon } = require('../utils/currency.js');
const { FISH_LIST } = require("../utils/fish");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { getCustomDate, MAX_LOVE_POINTS_PER_DAY } = require('../utils/constant.js');

async function becaHandler(args, message, fishTank, tankKey, userId) {
    const action = args[0]?.toLowerCase();

    // --- LOGIC BÁN CÁ (SELL) ---
    if (action === "sell") {
        const fishId = args[1]?.toLowerCase();
        let amountToSell = parseInt(args[2]);

        if (!fishId) return message.reply(`${errorIcon} | Cú pháp: \`.beca sell [ID] [Số lượng]\` hoặc \`.beca sell all\``);

        let totalMora = 0;
        let totalPrimo = 0;
        let soldCount = 0;

        // TRƯỜNG HỢP: BÁN TẤT CẢ (.beca sell all)
        if (fishId === "all") {
            if (fishTank.length === 0) return message.reply(`${errorIcon} | Bể cá của bạn đang trống.`);

            const newTank = [];
            fishTank.forEach(id => {
                const f = FISH_LIST[id];
                // Chỉ bán cá thường, GIỮ LẠI cá hiếm (Cá Voi, Cá Mập) hoặc cá có giá > 500
                //f.currency != 'primo'
                if (f && f.sellPrice < 10000) {
                    totalMora += f.sellPrice;
                    soldCount++;
                } else {
                    newTank.push(id); // Giữ lại trong bể
                }
            });

            if (soldCount === 0) return message.reply(`${errorIcon} | Không có cá thường nào để bán. Các loại cá hiếm đã được giữ lại an toàn!`);

            fishTank = newTank;
        }
        // TRƯỜNG HỢP: BÁN LOẠI CÁ CỤ THỂ
        else {
            const fish = FISH_LIST[fishId];
            if (!fish) return message.reply(`${errorIcon} | Loại cá này không tồn tại.`);

            const countInTank = fishTank.filter(id => id === fishId).length;
            if (countInTank === 0) return message.reply(`${errorIcon} | Bạn không có con **${fish.name}** nào.`);

            if (args[2]?.toLowerCase() === "all") amountToSell = countInTank;
            else amountToSell = amountToSell || 1;

            if (amountToSell > countInTank) return message.reply(`${errorIcon} | Bạn chỉ có **${countInTank}** con.`);

            for (let i = 0; i < amountToSell; i++) {
                const idx = fishTank.indexOf(fishId);
                fishTank.splice(idx, 1);
                if (fish.currency === 'primo') totalPrimo += fish.sellPrice;
                else totalMora += fish.sellPrice;
                soldCount++;
            }
        }

        await setKey(tankKey, fishTank);
        let rewards = [];
        if (totalMora > 0) {
            await addMoney(userId, totalMora, 'mora');
            rewards.push(`**${totalMora.toLocaleString()}** ${getIcon('mora')}`);
        }
        if (totalPrimo > 0) {
            await addMoney(userId, totalPrimo, 'primo');
            rewards.push(`**${totalPrimo.toLocaleString()}** ${getIcon('primo')}`);
        }
        return message.reply(`${verifyIcon} | Đã bán **${soldCount}** con cá. Nhận: ${rewards.join(" và ")} (Cá hiếm đã được giữ lại).`);
    }

    // --- LOGIC TẶNG CÁ (GIVE) ---
    if (action === "give") {
        const target = message.mentions.users.first();
        const fishId = args[2]?.toLowerCase();
        let amount = parseInt(args[3]) || 1;

        if (!target || !fishId) return message.reply(`${errorIcon} | Cú pháp: \`.beca give @User [ID Cá] [Số lượng]\``);
        if (target.id === userId) return message.reply(`${errorIcon} | Bạn không thể tự tặng cá cho chính mình!`);

        const fish = FISH_LIST[fishId];
        if (!fish) return message.reply(`${errorIcon} | Loại cá này không tồn tại.`);

        const countInTank = fishTank.filter(id => id === fishId).length;
        if (countInTank < amount) return message.reply(`${errorIcon} | Bạn không đủ **${amount}** con **${fish.name}** để tặng.`);

        // Trừ cá của người tặng
        for (let i = 0; i < amount; i++) {
            const idx = fishTank.indexOf(fishId);
            fishTank.splice(idx, 1);
        }
        await setKey(tankKey, fishTank);

        // Thêm cá cho người nhận
        const targetTankKey = renderKey("fishtank", target.id);
        let targetTank = (await getKey(targetTankKey)) || [];
        for (let i = 0; i < amount; i++) {
            targetTank.push(fishId);
        }
        await setKey(targetTankKey, targetTank);

        // --- LOGIC CẬP NHẬT CHỈ SỐ THÂN MẬT ---
        const guildId = message.guild.id;
        const coupleKey = renderKey('couple', guildId);
        let couplesList = (await getKey(coupleKey)) || [];

        const coupleIndex = couplesList.findIndex(c =>
            (c.husband === userId && c.wife === target.id) ||
            (c.husband === target.id && c.wife === userId)
        );

        let loveMsg = "";
        if (coupleIndex !== -1) {
            const today = getCustomDate();

            if (couplesList[coupleIndex].lastGiftDate !== today) {
                couplesList[coupleIndex].lastGiftDate = today;
                couplesList[coupleIndex].dailyLovePoints = 0;
            }

            let pointPerFish = 0;

            // Kiểm tra nếu là đồ rác (giá bán < 10 Mora)
            if (fish.sellPrice <= 10) {
                pointPerFish = -5;
            } else {
                // Ưu tiên lovePoint trong file fish.js, nếu không có tính 1% giá bán
                pointPerFish = fish.lovePoint !== undefined
                    ? fish.lovePoint
                    : Math.max(Math.floor((fish.sellPrice || 0) / 100), 1);
            }

            const totalLovePoints = pointPerFish * amount;
            const currentDaily = couplesList[coupleIndex].dailyLovePoints || 0;    

            if (totalLovePoints > 0) {
                const remainingQuota = MAX_LOVE_POINTS_PER_DAY - currentDaily;
                 if (remainingQuota <= 0) {
                    loveMsg = `\n⚠️ Hai bạn đã đạt giới hạn thân mật hôm nay. Hãy tặng tiếp sau 4h sáng mai!`;
                }else{                    
                    const pointsToAdd = Math.min(totalLovePoints, remainingQuota);
                    loveMsg = `\n💖 Chỉ số thân mật tăng: **+${pointsToAdd.toLocaleString()}** điểm!`;
                    couplesList[coupleIndex].lovePoints = (couplesList[coupleIndex].lovePoints || 0) + pointsToAdd;
                    couplesList[coupleIndex].dailyLovePoints = currentDaily + pointsToAdd;
                    
                     if (totalLovePoints > remainingQuota) {
                        loveMsg += `\n*(Một số điểm bị bỏ qua do vượt giới hạn ngày)*`;
                    }                     
                }                
            } else if (totalLovePoints < 0) {               
                couplesList[coupleIndex].lovePoints = (couplesList[coupleIndex].lovePoints || 0) + totalLovePoints;
                loveMsg = `\n💔 Tặng rác làm giảm: **${totalLovePoints}** điểm thân mật!`;
            }
            await setKey(coupleKey, couplesList);  
        }

        return message.reply(`${verifyIcon} | Bạn đã tặng **${amount}x ${fish.icon} ${fish.name}** cho **${target.username}** thành công!${loveMsg}`);
    }

    return false;
}

module.exports = { becaHandler };