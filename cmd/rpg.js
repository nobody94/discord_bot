const { EmbedBuilder } = require('discord.js');
const { getKey, setKey, addKey, renderKey } = require("../utils/db"); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { addMoney, getIcon } = require("../utils/currency");

// --- CẤU HÌNH HỆ ---
const ELEMENTS_CONFIG = {
    "hoa": { name: "Hỏa", emoji: "🔥", ref: 0xff4500, stats: { atk: 25, hp: 100 }, skill: "Hỏa Cầu" },
    "bang": { name: "Băng", emoji: "❄️", ref: 0x00ffff, stats: { atk: 10, hp: 180 }, skill: "Băng Vĩnh Cửu" },
    "thuy": { name: "Thủy", emoji: "💧", ref: 0x1e90ff, stats: { atk: 15, hp: 150 }, skill: "Sóng Thần" },
    "thao": { name: "Thảo", emoji: "🌿", ref: 0x32cd32, stats: { atk: 18, hp: 130 }, skill: "Dây Leo Quấn" },
    "nham": { name: "Nham", emoji: "🪨", ref: 0xffd700, stats: { atk: 12, hp: 200 }, skill: "Địa Chấn" },
    "loi":  { name: "Lôi", emoji: "⚡", ref: 0x9932cc, stats: { atk: 22, hp: 110 }, skill: "Thiên Lôi" }
};

// --- DANH SÁCH NHIỆM VỤ ---
const RANDOM_QUESTS = [
    { id: "q1", name: "Thợ săn tập sự", target: 20, rewardMora: 25000, rewardGems: 10, desc: "Thực hiện 20 lần đi săn" },
    { id: "q2", name: "Kẻ hủy diệt", target: 60, rewardMora: 70000, rewardGems: 30, desc: "Thực hiện 60 lần đi săn" },
    { id: "q3", name: "Cày thuê Teyvat", target: 40, rewardMora: 45000, rewardGems: 20, desc: "Thực hiện 40 lần đi săn" }
];

// --- HÀM TÍNH NGÀY RPG THEO MÚI GIỜ VN (RESET 4H SÁNG) ---
function getVietnamRPGDay() {
    const now = new Date();
    // Chuyển sang giờ VN (UTC+7) rồi trừ đi 4 tiếng để tính mốc reset
    // Tổng cộng: UTC + 7h - 4h = UTC + 3h
    const offsetDate = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    
    // Trả về chuỗi ngày (Ví dụ: "2024-05-20")
    return offsetDate.toISOString().split('T')[0];
}

module.exports = {
    name: "rpg",
    description: "Hệ thống RPG đa nguyên tố - Reset 4h sáng VN",

    async execute(message, args) {
        const userId = message.author.id;
        const key = await renderKey('rpg_user', userId);
        const subCommand = args[0]?.toLowerCase();
        let user = await getKey(key);

        const iconMora = getIcon('mora');
        const iconPrimo = getIcon('primo');
        const todayStr = getVietnamRPGDay(); // Lấy ngày RPG hiện tại (VN 4AM)

        // 1. MENU CHÍNH / PROFILE
        if (!subCommand) {
            if (user && user.data && user.data.element) {
                return this.showProfile(message, user.data, todayStr);
            }

            const embed = new EmbedBuilder()
                .setTitle("⚔️ KHÁM PHÁ NGUYÊN TỐ")
                .setDescription("Chọn hệ để bắt đầu: `.rpg choose [key]`\n")
                .setColor(0x2f3136);

            Object.keys(ELEMENTS_CONFIG).forEach(id => {
                const el = ELEMENTS_CONFIG[id];
                embed.addFields({ 
                    name: `${el.emoji} Hệ ${el.name}`, 
                    value: `Key: ${id}\nATK: ${el.stats.atk} | HP: ${el.stats.hp}`, 
                    inline: true 
                });
            });
            return message.reply({ embeds: [embed] });
        }

        // 2. CHỌN HỆ
        if (subCommand === 'choose') {
            if (user?.data?.element) return message.reply(`${errorIcon} | Bạn đã chọn hệ rồi!`);
            const choice = args[1]?.toLowerCase();
            const el = ELEMENTS_CONFIG[choice];
            if (!el) return message.reply(`${errorIcon} | Hệ không tồn tại!`);

            const stats = {
                data: {
                    element: el.name, level: 1, xp: 0,
                    atk: el.stats.atk, hp: el.stats.hp, skill: el.skill,
                    quest: null 
                }
            };
            await setKey(key, stats);
            return message.reply(`${verifyIcon} | Gia nhập hệ **${el.name}** thành công!`);
        }

        if (!user?.data) return message.reply(`${errorIcon} | Hãy chọn hệ trước!`);

        // 3. DAILY QUEST
        if (subCommand === 'daily') {
            // Kiểm tra reset quest theo ngày VN (4h sáng)
            if (!user.data.quest || user.data.quest.date !== todayStr) {
                const randomQ = RANDOM_QUESTS[Math.floor(Math.random() * RANDOM_QUESTS.length)];
                const newQuest = { ...randomQ, current: 0, date: todayStr, claimed: false };
                await setKey(`${key}.data.quest`, newQuest);
                user.data.quest = newQuest;
            }

            const q = user.data.quest;
            const embed = new EmbedBuilder()
                .setTitle(`📜 NHIỆM VỤ: ${q.name}`)
                .setDescription(`${q.desc}\n*(Reset vào 4h sáng hàng ngày)*`)
                .addFields(
                    { name: "Tiến độ", value: `📊 \`${q.current}/${q.target}\``, inline: true },
                    { name: "Thưởng", value: `💰 \`${q.rewardMora.toLocaleString()}\` ${iconMora}\n✨ \`${q.rewardGems}\` ${iconPrimo}`, inline: true }
                )
                .setColor(q.current >= q.target ? 0x00ff00 : 0xffff00);

            if (q.current >= q.target && !q.claimed) embed.setFooter({ text: "Gõ '.rpg claim' để nhận thưởng!" });
            if (q.claimed) embed.setFooter({ text: "Bạn đã nhận thưởng nhiệm vụ hôm nay rồi." });

            return message.reply({ embeds: [embed] });
        }

        // 4. CLAIM THƯỞNG
        if (subCommand === 'claim') {
            const q = user.data.quest;
            if (!q || q.date !== todayStr) return message.reply(`${errorIcon} | Chưa có nhiệm vụ hôm nay!`);
            if (q.current < q.target) return message.reply(`${errorIcon} | Bạn chưa hoàn thành nhiệm vụ!`);
            if (q.claimed) return message.reply(`${errorIcon} | Bạn đã nhận thưởng rồi.`);

            await addMoney(userId, q.rewardMora, 'mora');
            await addMoney(userId, q.rewardGems, 'primo');
            await setKey(`${key}.data.quest.claimed`, true);

            return message.reply(`${verifyIcon} | Nhận thành công **${q.rewardMora.toLocaleString()}** ${iconMora} và **${q.rewardGems}** ${iconPrimo}!`);
        }

        // 5. ĐI SĂN
        if (subCommand === 'hunt') {
            const randXP = Math.floor(Math.random() * 15) + 5;
            const randMora = Math.floor(Math.random() * 300) + 100;

            await addKey(`${key}.data.xp`, randXP);
            await addMoney(userId, randMora, 'mora');

            // Cập nhật tiến độ quest nếu cùng ngày RPG VN
            if (user.data.quest && user.data.quest.date === todayStr && user.data.quest.current < user.data.quest.target) {
                await addKey(`${key}.data.quest.current`, 1);
            }

            let msg = `⚔️ **${message.author.username}** săn quái nhận được **${randXP} XP** và **${randMora}** ${iconMora}.`;
            
            const updated = await getKey(key);
            if (updated.data.xp >= 100) {
                await addKey(`${key}.data.level`, 1);
                await setKey(`${key}.data.xp`, 0);
                await addKey(`${key}.data.atk`, 3);
                await addKey(`${key}.data.hp`, 10);
                msg += `\n🎊 **LEVEL UP!** Bạn đạt cấp **${updated.data.level + 1}**!`;
            }
            return message.reply(msg);
        }
    },

    async showProfile(message, d, todayStr) {
        const elConfig = Object.values(ELEMENTS_CONFIG).find(e => e.name === d.element);
        const q = d.quest;
        // Kiểm tra xem quest hiển thị có phải của hôm nay không
        const progressStr = (q && q.date === todayStr) ? `\`${q.current}/${q.target}\`` : `\`0/--\``;

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Profile: ${message.author.username}`)
            .setColor(elConfig?.ref || 0x2f3136)
            .addFields(
                { name: 'Hệ', value: `${elConfig ? elConfig.emoji : ''} ${d.element}`, inline: true },
                { name: 'Cấp độ', value: `⭐ ${d.level}`, inline: true },
                { name: 'Tấn công', value: `⚔️ ${d.atk}`, inline: true },
                { name: 'Máu', value: `❤️ ${d.hp}`, inline: true },
                { name: 'Daily Quest', value: `📈 ${progressStr}`, inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: "Nhiệm vụ reset lúc 4:00 AM" });

        return message.reply({ embeds: [embed] });
    }
};