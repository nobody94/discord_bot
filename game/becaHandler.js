const { setKey } = require("../utils/db");
const { addMoney, getIcon } = require('../utils/currency.js');
const { FISH_LIST } = require("../utils/fish");
const { errorIcon, verifyIcon } = require('../utils/icon.js');

async function becaHandler(args, message, fishTank, tankKey, userId) {
    if (args[0] === "sell") {
        const fishId = args[1]?.toLowerCase();
        let amountToSell = parseInt(args[2]);

        if (!fishId) return message.reply(`${errorIcon} | Cú pháp: \`.beca sell [ID] [Số lượng]\` hoặc \`.beca sell all\``);

        let totalMora = 0;
        let totalPrimo = 0;
        let soldCount = 0;

        // TRƯỜNG HỢP: BÁN TẤT CẢ (.beca sell all)
        if (fishId === "all") {
            if (fishTank.length === 0) return message.reply(`${errorIcon} | Bể cá của bạn đang trống.`);

            fishTank.forEach(id => {
                const f = FISH_LIST[id];
                if (f) {
                    if (f.currency === 'primo') totalPrimo += f.sellPrice;
                    else totalMora += f.sellPrice;
                    soldCount++;
                }
            });
            fishTank = []; // Xóa sạch bể
        } 
        // TRƯỜNG HỢP: BÁN LOẠI CÁ CỤ THỂ
        else {
            const fish = FISH_LIST[fishId];
            if (!fish) return message.reply(`${errorIcon} | Loại cá này không tồn tại trong hồ sơ.`);

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

        // Cập nhật DB    
        await setKey(tankKey, fishTank);

        let rewards = [];
        if (totalMora > 0){
            await addMoney(userId, totalMora, 'mora');
            rewards.push(`**${totalMora.toLocaleString()}** ${getIcon('mora')}`);
        }
        if (totalPrimo > 0) {
            await addMoney(userId, totalPrimo, 'primo');
            rewards.push(`**${totalPrimo.toLocaleString()}** ${getIcon('primo')}`);
        }
        return message.reply(`${verifyIcon} | Bạn đã bán **${soldCount}** con cá và nhận về ${rewards.join(" và ")}!`);
    }
    return false;
}

module.exports = { becaHandler };