const { EmbedBuilder } = require('discord.js');
const { addMoney, removeMoney, getIcon, getBalance } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, getKey, setKey, deleteKey } = require('../utils/db.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

// Giá vé
const TICKET_PRICE = 1000;
// số lượng vé có thể mua
const MAX_TICKETS_PER_USER = 40;
// Thuế 
const TAX_RATE = 0.2;
//
const OVER_MONEY = 1000000;

module.exports = {
    name: 'xoso',
    aliases: ['xs', 'lottery'],
    description: 'Hệ thống xổ số Jackpot.',

    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        const guildId = message.guild.id;
        const lotteryKey = renderKey("lottery", guildId);
        const jackpotKey = renderKey("lottery_jackpot", guildId);
        const winNumKey = renderKey("last_win_num", guildId);
        const statusKey = renderKey("lottery_status", guildId);
        const currencyType = 'mora';
        const isDev = DEVELOPER_IDS.includes(message.author.id);
        const isAdmin = message.member.permissions.has('Administrator') || isDev;

        try {
            // --- 1. MUA VÉ (.xoso mua <số lượng>) ---
            if (action === 'mua') {
                const isClosed = await getKey(statusKey);
                if (isClosed === 'closed') {
                    return message.reply(`${errorIcon} | Hiện tại cửa hàng xổ số đang **đóng cửa** để chuẩn bị quay số. Vui lòng quay lại sau!`);
                }

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

                return message.reply(`${verifyIcon} | Mua thành công **${quantity}** vé với tổng giá ${totalCost} ${getIcon(currencyType)}.`);
            }

            // --- LỆNH ĐÓNG CỬA (ADMIN/DEV) ---
            else if (action === 'dong') {
                if (!isAdmin) return message.reply(`${errorIcon} | Bạn không có quyền đóng cửa hàng.`);
                await setKey(statusKey, 'closed');
                return message.reply(`**Cửa hàng xổ số đã ĐÓNG.** Không thể mua vé mới.`);
            }

            // --- LỆNH MỞ CỬA (ADMIN/DEV) ---
            else if (action === 'mo') {
                if (!isAdmin) return message.reply(`${errorIcon} | Bạn không có quyền mở cửa hàng.`);
                await setKey(statusKey, 'open')
                return message.reply(`**Cửa hàng xổ số đã MỞ.** Chúc mọi người may mắn!`);
            }

            // --- 2. KIỂM TRA CÁ NHÂN (.xoso check) ---
            else if (action === 'check') {
                const targetUser = message.mentions.users.first() || message.author
                const allTickets = (await getKey(lotteryKey)) || [];
                const myTickets = allTickets.filter(t => t.userId === targetUser.id);
                const currentJackpot = (await getKey(jackpotKey)) || 0;

                const embed = new EmbedBuilder()
                    .setTitle(`🎫 VÉ CỦA ${targetUser.username.toUpperCase()}`)
                    .addFields(
                        { name: '💰 Hũ Jackpot hiện tại', value: `**${currentJackpot.toLocaleString()}** ${getIcon(currencyType)}`, inline: true },
                        { name: '🎟️ Số vé', value: `**${myTickets.length}/${MAX_TICKETS_PER_USER}**`, inline: true },
                        { name: '🔢 Danh sách số', value: myTickets.length > 0 ? myTickets.map(t => `\`${t.number}\``).join(', ') : 'Chưa có vé nào.' }
                    )
                    .setColor(0xFFAA00);
                return message.reply({ embeds: [embed] });
            }

            // --- 3. XEM TẤT CẢ (ADMIN/DEV - .xoso all) ---
            else if (action === 'all') {
                if (!isAdmin) return message.reply(`${errorIcon} | Chỉ Admin mới xem được danh sách.`);

                const allTickets = (await getKey(lotteryKey)) || [];
                if (allTickets.length === 0) return message.reply("Chưa có vé nào được mua.");

                // 1. Nhóm vé theo userId
                const groupedTickets = allTickets.reduce((acc, ticket) => {
                    if (!acc[ticket.userId]) {
                        acc[ticket.userId] = [];
                    }
                    acc[ticket.userId].push(`\`${ticket.number}\``);
                    return acc;
                }, {});

                const userIds = Object.keys(groupedTickets);
                const totalUsers = userIds.length;
                const itemsPerPage = 5; // Mỗi trang hiển thị 10 người
                const totalPages = Math.ceil(totalUsers / itemsPerPage);

                // 2. Lấy số trang từ args[1] (ví dụ: .xs all 2)
                let page = parseInt(args[1]) || 1;
                if (page < 1) page = 1;
                if (page > totalPages) page = totalPages;

                // 3. Cắt danh sách người chơi cho trang hiện tại
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageUsers = userIds.slice(start, end);

                // 4. Tạo nội dung hiển thị cho trang đó
                const list = pageUsers.map((userId, i) => {
                    const globalIndex = start + i + 1;
                    return `**${globalIndex}.** <@${userId}>\n> 🎟️ Vé: ${groupedTickets[userId].join(', ')}`;
                }).join('\n\n');

                const currentJackpot = (await getKey(jackpotKey)) || 0;

                const embed = new EmbedBuilder()
                    .setTitle(`📂 DANH SÁCH VÉ SERVER - TRANG ${page}/${totalPages}`)
                    .setDescription(list)
                    .addFields(
                        { name: '📊 Thống kê', value: `Tổng: **${totalUsers}** người chơi | **${allTickets.length}** vé`, inline: true },
                        { name: '💰 Hũ Jackpot', value: `**${currentJackpot.toLocaleString()}** ${getIcon(currencyType)}`, inline: true }
                    )
                    .setFooter({ text: `Dùng .xoso all <số trang> để xem trang tiếp theo.` })
                    .setColor(0x2F3136)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // --- 4. QUAY SỐ (ADMIN/DEV - .xoso quay) ---
            else if (action === 'quay') {
                if (!isAdmin) return message.reply(`${errorIcon} | Bạn không có quyền quay số.`);
                const allTickets = (await getKey(lotteryKey)) || [];
                if (allTickets.length === 0) return message.reply("⚠️ Chưa có vé nào để quay.");

                const currentJackpot = (await getKey(jackpotKey)) || 0; // Lấy số tiền hũ hiện tại
                const statusMsg = await message.channel.send("🎰 **CHUẨN BỊ QUAY THƯỞNG...** 🎰");

                let secondsLeft = 5;

                const animation = setInterval(async () => {
                    if (secondsLeft > 0) {
                        const r1 = Math.floor(Math.random() * 10);
                        const r2 = Math.floor(Math.random() * 10);
                        const r3 = Math.floor(Math.random() * 10);

                        await statusMsg.edit(
                            `🎰 Đang quay: **[ ${r1} | ${r2} | ${r3} ]** 🎰\n` +
                            `⏱️ Kết quả sẽ có sau: **${secondsLeft}** giây...`
                        ).catch(() => { });

                        secondsLeft--;
                    } else {
                        clearInterval(animation);

                        let winNum;
                        // --- LOGIC CẬP NHẬT: KIỂM TRA HŨ > OVER_MONEY MORA ---
                        if (currentJackpot > OVER_MONEY) {
                            // Lấy ngẫu nhiên một vé từ danh sách những người đã mua
                            const luckyTicket = allTickets[Math.floor(Math.random() * allTickets.length)];
                            winNum = luckyTicket.number;
                        } else {
                            // Nếu hũ thấp hơn hoặc bằng 1 triệu, quay số ngẫu nhiên hoàn toàn (000-999)
                            const winNumRaw = Math.floor(Math.random() * 1000);
                            winNum = winNumRaw.toString().padStart(3, '0');
                        }

                        const displayWin = winNum.split('').join(' | ');
                        const winners = allTickets.filter(t => t.number === winNum);

                        const embed = new EmbedBuilder()
                            .setTitle("🎊 KẾT QUẢ XỔ SỐ CHÍNH THỨC 🎊")
                            .setTimestamp();

                        if (winners.length > 0) {
                            const winnerMentions = [...new Set(winners.map(w => `<@${w.userId}>`))].join(', ');
                            embed.setColor(0x00FF00)
                                .setDescription(
                                    `🔢 Con số may mắn: **[ ${displayWin} ]**\n\n` +
                                    `🎉 Chúc mừng những người sau đây đã trúng giải!\n${winnerMentions}\n` +
                                    `👉 Dùng \`.xoso thuong\` để phát thưởng ngay.`
                                );
                        } else {
                            embed.setColor(0xFF0000)
                                .setDescription(
                                    `🔢 Con số may mắn: **[ ${displayWin} ]**\n\n` +
                                    `❌ Rất tiếc, không có ai trúng đợt này.\n` +
                                    `💰 Jackpot tiếp tục được cộng dồn! Dùng \`.xoso thuong\` để bỏ vé cũ.`
                                );
                        }

                        await setKey(winNumKey, winNum);
                        await statusMsg.edit({
                            content: "✅ **QUAY THƯỞNG HOÀN TẤT!**",
                            embeds: [embed]
                        }).catch(() => { });
                    }
                }, 1000);

                return;
            }

            // --- 5. THƯỞNG (CHỈ DEV - .xoso thuong) ---
            else if (action === 'thuong') {
                if (!isDev) return message.reply(`${errorIcon} | Chỉ Dev mới phát thưởng được.`);

                const allTickets = (await getKey(lotteryKey)) || [];
                const jackpot = (await getKey(jackpotKey)) || 0;
                const winNum = await getKey(winNumKey);

                if (!winNum) return message.reply("⚠️ Hãy quay số trước bằng lệnh `.xoso quay`.");

                const winners = allTickets.filter(t => t.number === winNum);
                if (winners.length === 0) {
                    await deleteKey(lotteryKey);
                    await deleteKey(winNumKey);
                    return message.reply(`📢 Không có ai trúng số **${winNum}**. Đã hủy vé đợt cũ.`);
                }

                // --- LOGIC THUẾ ---
                const tax = Math.floor(jackpot * TAX_RATE);
                const finalPrizePool = jackpot - tax;
                const prizePerPerson = Math.floor(finalPrizePool / winners.length);

                const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

                for (const w of winners) {
                    await addMoney(w.userId, prizePerPerson, currencyType);
                }

                const embed = new EmbedBuilder()
                    .setTitle("💰 PHÁT THƯỞNG XỔ SỐ 💰")
                    .setColor(0x00FF00)
                    .setDescription(
                        `🔢 Số trúng: **[ ${winNum.split('').join(' | ')} ]**\n\n` +
                        `👤 **Người trúng:** ${winnerMentions}\n` +
                        `💵 **Tổng hũ:** ${jackpot.toLocaleString()}${getIcon(currencyType)}\n` +
                        `🧧 **Thuế (${TAX_RATE * 100}%):** ${tax.toLocaleString()}${getIcon(currencyType)}\n` +
                        `💰 **Thực nhận:** **${prizePerPerson.toLocaleString()}**${getIcon(currencyType)} / người`
                    )
                    .setFooter({ text: "Tiền thuế đã được nộp vào Ngân khố Server." });

                await setKey(jackpotKey, 0);
                await deleteKey(lotteryKey);
                await deleteKey(winNumKey);

                return message.channel.send({ content: `🎊 Chúc mừng: ${winnerMentions}`, embeds: [embed] });
            }

            else {
                return message.reply(`📝 **LỆNH XỔ SỐ:**\n> .xoso mua <số>: Mua vé (Max ${MAX_TICKETS_PER_USER}).\n> .xoso check: Xem vé cá nhân.\n> .xoso all: Xem tất cả vé (Admin/Dev).\n> .xoso quay: Quay số (Admin/Dev).\n> .xoso thuong: Phát giải (Dev).`);
            }

        } catch (error) {
            console.error(error);
            message.reply("Lỗi hệ thống.");
        }
    }
};