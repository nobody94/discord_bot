const { EmbedBuilder } = require('discord.js');
const { addMoney, removeMoney, getIcon, getBalance } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, getKey, setKey, deleteKey } = require('../utils/db.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

// --- CẤU HÌNH ---
const TICKET_PRICE = 1000;
const MAX_TICKETS_PER_USER = 10;

module.exports = {
    name: 'soxo',
    aliases: ['sx', 'lottery'],
    description: 'Hệ thống xổ số Jackpot chuyên sâu.',

    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        const guildId = message.guild.id;
        const lotteryKey = renderKey("lottery", guildId);
        const jackpotKey = renderKey("lottery_jackpot", guildId);
        const currencyType = 'mora';
        const isDev = DEVELOPER_IDS.includes(message.author.id);
        const isAdmin = message.member.permissions.has('Administrator') || isDev;

        try {
            // --- 1. MUA VÉ (.soxo mua <số lượng>) ---
            if (action === 'mua') {
                const quantity = parseInt(args[1]) || 1;
                if (quantity <= 0) return message.reply("⚠️ Số lượng không hợp lệ.");

                let allTickets = (await getKey(lotteryKey)) || [];
                const userTickets = allTickets.filter(t => t.userId === message.author.id);

                if (userTickets.length + quantity > MAX_TICKETS_PER_USER) {
                    return message.reply(`${errorIcon} | Bạn chỉ được sở hữu tối đa ${MAX_TICKETS_PER_USER} vé. (Hiện có: ${userTickets.length})`);
                }

                const totalCost = quantity * TICKET_PRICE;
                if (await getBalance(message.author.id, currencyType) < totalCost) {
                    return message.reply(`${errorIcon} | Bạn không đủ tiền. Cần **${totalCost.toLocaleString()}** ${getIcon(currencyType)}.`);
                }

                await removeMoney(message.author.id, totalCost, currencyType);
                let currentJackpot = (await getKey(jackpotKey)) || 0;

                for (let i = 0; i < quantity; i++) {
                    const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 000-999
                    allTickets.push({ userId: message.author.id, number: num });
                }

                await setKey(lotteryKey, allTickets);
                await setKey(jackpotKey, currentJackpot + totalCost);

                return message.reply(`${verifyIcon} | Mua thành công **${quantity}** vé! Hũ Jackpot: **${(currentJackpot + totalCost).toLocaleString()}**.`);
            }

            // --- 2. KIỂM TRA CÁ NHÂN (.soxo check) ---
            else if (action === 'check') {
                const allTickets = (await getKey(lotteryKey)) || [];
                const myTickets = allTickets.filter(t => t.userId === message.author.id);
                const currentJackpot = (await getKey(jackpotKey)) || 0;

                const embed = new EmbedBuilder()
                    .setTitle(`🎫 VÉ CỦA ${message.author.username.toUpperCase()}`)
                    .addFields(
                        { name: '💰 Jackpot hiện tại', value: `**${currentJackpot.toLocaleString()}** ${getIcon(currencyType)}`, inline: true },
                        { name: '🎟️ Số vé', value: `**${myTickets.length}/10**`, inline: true },
                        { name: '🔢 Danh sách số', value: myTickets.length > 0 ? myTickets.map(t => `\`${t.number}\``).join(', ') : 'Chưa có vé nào.' }
                    )
                    .setColor(0xFFAA00);
                return message.reply({ embeds: [embed] });
            }

            // --- 3. XEM TẤT CẢ (ADMIN/DEV - .soxo all) ---
            else if (action === 'all') {
                if (!isAdmin) return message.reply(`${errorIcon} | Chỉ Admin mới xem được danh sách.`);
                const allTickets = (await getKey(lotteryKey)) || [];
                if (allTickets.length === 0) return message.reply("Chưa có vé nào được mua.");

                const list = allTickets.map((t, i) => `**${i+1}.** <@${t.userId}>: \`${t.number}\``).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle("📂 TỔNG DANH SÁCH VÉ SERVER")
                    .setDescription(list.length > 2000 ? "Danh sách quá dài..." : list)
                    .setColor(0x000000);
                return message.reply({ embeds: [embed] });
            }

            // --- 4. QUAY SỐ (ADMIN/DEV - .soxo quay) ---
            else if (action === 'quay') {
                if (!isAdmin) return message.reply(`${errorIcon} | Bạn không có quyền quay số.`);
                const allTickets = (await getKey(lotteryKey)) || [];
                if (allTickets.length === 0) return message.reply("⚠️ Chưa có vé nào để quay.");

                const statusMsg = await message.channel.send("🎰 **CHUẨN BỊ QUAY THƯỞNG...** 🎰");

                let secondsLeft = 5; // Đếm ngược 5 giây
                
                const animation = setInterval(async () => {
                    if (secondsLeft > 0) {
                        // Tạo dãy số random kiểu [0|0|0]
                        const r1 = Math.floor(Math.random() * 10);
                        const r2 = Math.floor(Math.random() * 10);
                        const r3 = Math.floor(Math.random() * 10);

                        await statusMsg.edit(
                            `🎰 Đang quay: **[ ${r1} | ${r2} | ${r3} ]** 🎰\n` +
                            `⏱️ Kết quả sẽ có sau: **${secondsLeft}** giây...`
                        ).catch(() => {});
                        
                        secondsLeft--;
                    } else {
                        // KẾT THÚC QUAY
                        clearInterval(animation);
                        
                        // Tạo số trúng thưởng thực tế (000-999)
                        const winNumRaw = Math.floor(Math.random() * 1000);
                        const winNum = winNumRaw.toString().padStart(3, '0');
                        
                        // Tách số để hiển thị đẹp [X|X|X]
                        const displayWin = winNum.split('').join(' | ');

                        const winners = allTickets.filter(t => t.number === winNum);
                        const embed = new EmbedBuilder()
                            .setTitle("🎊 KẾT QUẢ XỔ SỐ CHÍNH THỨC 🎊")
                            .setTimestamp();

                        if (winners.length > 0) {
                            embed.setColor(0x00FF00)
                                 .setDescription(
                                     `🔢 Con số may mắn: **[ ${displayWin} ]**\n\n` +
                                     `🎉 Chúc mừng **${winners.length}** người đã trúng giải!\n` +
                                     `👉 Dùng \`.soxo thuong\` để phát thưởng ngay.`
                                 );
                        } else {
                            embed.setColor(0xFF0000)
                                 .setDescription(
                                     `🔢 Con số may mắn: **[ ${displayWin} ]**\n\n` +
                                     `❌ Rất tiếc, không có ai trúng đợt này.\n` +
                                     `💰 Jackpot tiếp tục được cộng dồn!`
                                 );
                            await deleteKey(lotteryKey); // Xóa vé cũ
                        }

                        // Lưu số trúng vào DB để lệnh 'thuong' sử dụng
                        await setKey(renderKey("last_win_num", guildId), winNum);
                        
                        await statusMsg.edit({ 
                            content: "✅ **QUAY THƯỞNG HOÀN TẤT!**", 
                            embeds: [embed] 
                        }).catch(() => {});
                    }
                }, 1000); // Mỗi 1 giây cập nhật một lần (an toàn cho Discord Rate Limit)

                return;
            }

            // --- 5. THƯỞNG (CHỈ DEV - .soxo thuong) ---
            else if (action === 'thuong') {
                if (!isDev) return message.reply(`${errorIcon} | Chỉ Dev mới có quyền phát thưởng.`);
                
                const allTickets = (await getKey(lotteryKey)) || [];
                const jackpot = (await getKey(jackpotKey)) || 0;
                const winNum = await getKey(renderKey("last_win_num", guildId));

                if (!winNum) return message.reply("Hãy chạy lệnh `.soxo quay` trước.");

                const winners = allTickets.filter(t => t.number === winNum);
                if (winners.length === 0) return message.reply("Không có ai trúng số này để thưởng.");

                const prize = Math.floor(jackpot / winners.length);
                for (const w of winners) {
                    await addMoney(w.userId, prize, currencyType);
                }

                await setKey(jackpotKey, 0);
                await deleteKey(lotteryKey);
                await deleteKey(renderKey("last_win_num", guildId));

                return message.reply(`${verifyIcon} | Đã phát thưởng thành công **${prize.toLocaleString()}** cho mỗi người thắng!`);
            }

            else {
                return message.reply("📝 **Lệnh:** `mua`, `check`, `all` (Admin), `quay` (Admin), `thuong` (Dev).");
            }

        } catch (error) {
            console.error(error);
            message.reply("Lỗi hệ thống.");
        }
    }
};