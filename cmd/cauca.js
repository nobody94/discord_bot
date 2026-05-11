const { EmbedBuilder,Collection } = require("discord.js");
const { getKey, renderKey, setKey, updateLeaderboard } = require("../utils/db");
const { FISH_LIST, FISH_SHOP_ITEMS } = require("../utils/fish");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { getIcon } = require('../utils/currency.js');
const { checkCooldown,getCountdown } = require('../utils/cooldown');

module.exports = {
    name: "cauca",
    aliases: ["fish", "cc"],
    description: "Câu cá nhiều lần",

    async execute(message, args) {
        const userId = message.author.id;
        const username = message.author.username;
        const guildId = message.guild.id;
        const now = Date.now();
        const limitTime = 200;

        // 1. XỬ LÝ SỐ LẦN CÂU (Tối đa 5)
        let times = parseInt(args[0]) || 1;
        if (times < 1) times = 1;
        if (times > 20) times = 20;

        // 2. KIỂM TRA GIỚI HẠN TẬP TRUNG (fish_limit)
        const limitKey = "fish_limit";
        let allLimitData = (await getKey(limitKey)) || {};

        // Khởi tạo nếu user chưa có trong data chung
        if (!allLimitData[userId]) {
            allLimitData[userId] = { count: 0, nextReset: 0 };
        }

        let userLimit = allLimitData[userId];

        // Hàm tính mốc 4h sáng VN (UTC+7)
        const getNextResetTime = () => {
            const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            const resetTime = new Date(nowVN);
            resetTime.setHours(4, 0, 0, 0);
            if (nowVN.getTime() >= resetTime.getTime()) {
                resetTime.setDate(resetTime.getDate() + 1);
            }
            return resetTime.getTime() - (7 * 60 * 60 * 1000);
        };

        // Kiểm tra reset lượt câu
        if (now >= userLimit.nextReset) {
            userLimit.count = 0;
            userLimit.nextReset = getNextResetTime();
        }

        // Kiểm tra nếu vượt quá limitTime lượt
        if (userLimit.count >= limitTime) {
            const wait = userLimit.nextReset - now;
            const h = Math.floor(wait / 3600000);
            const m = Math.floor((wait % 3600000) / 60000);
            return message.reply(`${errorIcon} | **${username}** đã hết ${limitTime} lượt câu hôm nay. Reset sau **${h}g ${m}p**!`);
        }

        if (userLimit.count + times > limitTime) {
            return message.reply(`${errorIcon} | Bạn chỉ còn **${limitTime - userLimit.count}** lượt câu. Hãy thử số lượng nhỏ hơn.`);
        }

        // --- KIỂM TRA COOLDOWN ---
        if (checkCooldown(message.author.id, 'cauca', 10)) {
            return message.reply(`${errorIcon} | Chờ **${getCountdown(message.author.id, this.name, 10)}** để thả cần!`).then(msg => setTimeout(() => msg.delete().catch(() => null), 2000));;
        }

        // 4. KIỂM TRA ĐỒ CÂU TRONG TÚI
        const fishInvKey = renderKey("fish_inv", userId);
        let inventory = (await getKey(fishInvKey)) || [];

        const rodEntry = inventory.find(item => typeof item === 'object' && item.id.includes("cancau"));
        // console.log('rodEntry',rodEntry)
        if (!rodEntry) {
            return message.reply(`${errorIcon} | Cần câu của bạn không có!`);
        }
        if(rodEntry.durability <= 0){
            return message.reply(`${errorIcon} | Cần câu của bạn đã bị hỏng vui lòng sửa hoặc thay mới!`);
        }
        if (rodEntry.durability < times) {
            return message.reply(`${errorIcon} | Cần câu của bạn không đủ độ bền để câu!`);
        }


        const baitIndex = inventory.findIndex(item => typeof item === 'string' && item.includes("moi"));
        if (baitIndex === -1) {
            return message.reply(`${errorIcon} | Bạn đã hết mồi câu!`);
        }

        const baitId = inventory[baitIndex];
        const rodData = FISH_SHOP_ITEMS[rodEntry.id];
        const baitData = FISH_SHOP_ITEMS[baitId];

        // 5. LOGIC CÂU CÁ
        const totalLuck = rodData.luck + (baitData.luck || 0);
        let caughtFishList = [];
        let missCount = 0;

        for (let i = 0; i < times; i++) {
            // Tỉ lệ hụt (Miss)
            const missChance = Math.max(0.05, 0.25 - (totalLuck * 0.05));
            if (Math.random() < missChance) {
                missCount++;
                // await updateLeaderboard("miss", userId, username, guildId);
                continue;
            }

            // Điều chỉnh trọng số (Weight)
            const adjustedChances = Object.entries(FISH_LIST).map(([id, data]) => {
                let weight = data.chance;
                if (data.currency == 'primo' || (data.sellPrice > 1000 && data.currency == 'mora')) {
                    weight *= totalLuck;
                    // Tăng tỉ lệ ra Cá Voi cho cần Hoàng Kim
                    if (rodEntry.id === "cancau_hoang_kim" && data.currency == 'primo') weight *= 2;
                    if (totalLuck < 2.0) weight *= 0.4;
                } else if (data.sellPrice < 10) {
                    weight /= Math.pow(totalLuck, 2); // Giảm rác khi cần xịn
                }
                return { id, weight };
            });

            const totalWeight = adjustedChances.reduce((sum, f) => sum + f.weight, 0);
            const roll = Math.random();
            let cumulative = 0;
            for (const f of adjustedChances) {
                cumulative += f.weight / totalWeight;
                if (roll < cumulative) {
                    caughtFishList.push(f.id);
                    break;
                }
            }
        }

        // 6. CẬP NHẬT DỮ LIỆU
        rodEntry.durability -= times;
        inventory.splice(baitIndex, 1); // Trừ 1 mồi (hoặc times nếu muốn)

        const tankKey = renderKey("fishtank", userId);
        let tank = (await getKey(tankKey)) || [];
        caughtFishList.forEach(id => tank.push(id));

        // Cập nhật giới hạn chung
        userLimit.count += times;
        allLimitData[userId] = userLimit;

        // Lưu tất cả cùng lúc
        await Promise.all([
            setKey(fishInvKey, inventory),
            setKey(tankKey, tank),
            setKey(limitKey, allLimitData)            
        ]);       

        // 7. HIỂN THỊ KẾT QUẢ
        let timeLeft = 3;
        const waitEmbed = new EmbedBuilder()
            .setColor("#3498db")
            .setTitle(`🎣 ĐANG THẢ CẦN (${times} LẦN)...`)
            .setDescription(`Cần: **${rodData.name}**\nĐộ bền còn lại: **${rodEntry.durability}**\n\n*Vui lòng chờ kéo cần trong **${timeLeft}** giây...*`);

        const msg = await message.reply({ embeds: [waitEmbed] });

        const countdown = setInterval(async () => {
            timeLeft--;

            if (timeLeft > 0) {
                // Cập nhật số giây còn lại vào Embed
                const updateWaitEmbed = new EmbedBuilder()
                    .setColor("#3498db")
                    .setTitle(`🎣 ĐANG THẢ CẦN (${times} LẦN)...`)
                    .setDescription(`Cần: **${rodData.name}**\nĐộ bền còn lại: **${rodEntry.durability}**\n\n*Vui lòng chờ kéo cần trong **${timeLeft}** giây...*`);

                await msg.edit({ embeds: [updateWaitEmbed] }).catch(() => clearInterval(countdown));
            } else {
                // Khi hết thời gian, dừng vòng lặp và hiển thị kết quả
                clearInterval(countdown);

                const resultEmbed = new EmbedBuilder()
                    .setTitle(`🎣 ${username.toUpperCase()} VỪA THẢ CẦN`)
                    .setColor("#2ecc71")
                    .addFields(
                        { name: "Cần câu", value: `${rodData.icon} ${rodData.name}`, inline: true },
                        { name: "Lượt câu ngày", value: `📊 ${userLimit.count}/200`, inline: true }
                    );

                if (caughtFishList.length > 0) {
                    const summary = {};
                    caughtFishList.forEach(id => summary[id] = (summary[id] || 0) + 1);
                    const display = Object.entries(summary).map(([id, count]) => {
                        const f = FISH_LIST[id];
                        // if (f.sellPrice < 10) updateLeaderboard("trash", userId, username, guildId);
                        return `${f.icon} **${f.name}** x${count}`;
                    }).join("\n");
                    resultEmbed.setDescription(`**Bạn đã kéo lên được:**\n${display}${missCount>0 ? `\n💨Có ${missCount} con cá đã thoát` : ''}`);
                } else {
                    resultEmbed.setDescription("Thật tiếc, cá đã thoát mất tiêu rồi! 💨").setColor("#e74c3c");
                }

                if (missCount > 0 && times > 1) {
                    resultEmbed.setFooter({ text: `Độ bền còn: ${rodEntry.durability}` });
                } else {
                    resultEmbed.setFooter({ text: `Độ bền cần: ${rodEntry.durability}/${rodData.maxDurability}` });
                }

                await msg.edit({ embeds: [resultEmbed] }).catch(() => { });
            }
        }, 1000); 
       
    }
};