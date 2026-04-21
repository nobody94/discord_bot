const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getKey, setKey, renderKey } = require("../utils/db");
const { getBalance, removeMoney, addMoney, getIcon } = require('../utils/currency');
const { DEVELOPER_IDS, exchangeRate } = require("../utils/constant.js");
const {verifyIcon,errorIcon} = require('../utils/icon.js');

const maxMora = 500000;
const maxPrimo = 50;

module.exports = {
    name: "thachdau",
    aliases: ["td"],
    description: "",

    async execute(message, args) {
        const dbKey = renderKey('thach_dau', message.guild.id);
        const subCommand = args[0] ? args[0].toLowerCase() : null;

        if (subCommand === 'huy'){
            if (!DEVELOPER_IDS.includes(message.author.id)) return;

            const duelId = args[1];
            if (!duelId) return message.reply("⚠️ Vui lòng nhập ID trận đấu. Ví dụ: `.td dong 123456`");

            const pendingDuels = await getKey(dbKey) || [];
            const duel = pendingDuels.find(d => d.id === duelId);            

            if (!duel) return message.reply(`${errorIcon} Không tìm thấy trận thách đấu với ID này.`);

            const betters = duel.betters || [];
            
            await addMoney(duel.player1.id,duel.bet,duel.currency);
            await addMoney(duel.player2.id,duel.bet,duel.currency);

            const betMsg = [];

            if(betters.length > 0){
                for(const better of betters){
                    betMsg.push(`<@${better.userId}> nhận ${better.amount.toLocaleString()} ${getIcon(better.currency)}`)
                    await addMoney(better.userId,better.amount,better.currency);                    
                }
            }

            return message.reply(`${verifyIcon} Trận đấu đã bị hủy.\n<@${duel.player1.id}> và <@${duel.player2.id}> nhận ${duel.bet.toLocaleString()} ${getIcon(duel.currency)}\n${betMsg.join('\n')}`);
        }

        if (subCommand === 'dong'){
            if (!DEVELOPER_IDS.includes(message.author.id)) return;
            
            const duelId = args[1];
            if (!duelId) return message.reply("⚠️ Vui lòng nhập ID trận đấu. Ví dụ: `.td dong 123456`");

            const pendingDuels = await getKey(dbKey) || [];
            const duel = pendingDuels.find(d => d.id === duelId);            

            if (!duel) return message.reply(`${errorIcon} Không tìm thấy trận thách đấu với ID này.`);

            const updateDuels = pendingDuels.map(d => d.id === duelId ? {...d,status:'closed'} : d);
            await setKey(dbKey, updateDuels);
            return message.reply(`Trận đấu ${duelId} đã ngừng nhận cược.`);
        }

        //XEM DANH SÁCH (.td list)
        if (subCommand === 'list') {
            const pendingDuels = await getKey(dbKey) || [];

            if (pendingDuels.length === 0) {
                return message.reply("Hiện không có trận thách đấu nào.");
            }

            const itemsPerPage = 5; // Số trận mỗi trang
            let currentPage = 0;
            const maxPages = Math.ceil(pendingDuels.length / itemsPerPage);

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const currentItems = pendingDuels.slice(start, end);

                const listEmbed = new EmbedBuilder()
                    .setTitle("⚔️ DANH SÁCH THÁCH ĐẤU")
                    .setColor(0x3498db)
                    .setFooter({ text: `Trang ${page + 1}/${maxPages} • Tổng: ${pendingDuels.length} trận\n.td cuoc <id> <1/2> <số tiền> <mora/primo> để đặt cược.` });

                let description = "";
                currentItems.forEach((duel, index) => {
                    const stt = start + index + 1;

                    description += `**${stt}. ID: \`${duel.id}\`** \n` +
                        `> <@${duel.player1.id}> vs <@${duel.player2.id}> - ${duel.bet.toLocaleString()} ${getIcon(duel.currency)}\n`;
                });

                listEmbed.setDescription(description || "Không có dữ liệu.");
                return listEmbed;
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('⬅️ Trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Sau ➡️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(maxPages <= 1)
            );

            const listMsg = await message.channel.send({
                embeds: [generateEmbed(0)],
                components: [row]
            });

            const collector = listMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000 // Tự động tắt sau 1 phút
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== message.author.id) return i.reply({ content: "Bạn không thể dùng nút này!", ephemeral: true });

                if (i.customId === 'prev_page') currentPage--;
                else if (i.customId === 'next_page') currentPage++;

                const newRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('⬅️ Trước')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Sau ➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === maxPages - 1)
                );

                await i.update({ embeds: [generateEmbed(currentPage)], components: [newRow] });
            });

            collector.on('end', () => {
                listMsg.edit({ components: [] }).catch(() => { });
            });
            return;
        }

        // --- KIỂM TRA CHI TIẾT (.td check <id>) ---
        if (subCommand === 'check') {
            const duelId = args[1];
            if (!duelId) return message.reply("⚠️ Vui lòng nhập ID trận đấu. Ví dụ: `.td check 123456`");

            const pendingDuels = await getKey(dbKey) || [];
            const duel = pendingDuels.find(d => d.id === duelId);

            if (!duel) return message.reply(`${errorIcon} Không tìm thấy trận thách đấu với ID này.`);

            // Phân loại danh sách người đặt cược
            const betterSide1 = (duel.betters || []).filter(b => b.side === "1");
            const betterSide2 = (duel.betters || []).filter(b => b.side === "2");

            let player1Mora = 0;
            let player1Primo = 0;
            let player2Mora = 0;
            let player2Primo = 0;
            const player1Bet = [];
            const player2Bet = [];

            for (const better of duel.betters) {
                if (better.side == 1) {
                    if (better.currency == 'mora') {
                        player1Mora += better.amount
                    } else {
                        player1Primo += better.amount
                    }
                } else {
                    if (better.currency == 'mora') {
                        player2Mora += better.amount
                    } else {
                        player2Primo += better.amount
                    }
                }
            }
            if (player1Mora > 0) {
                player1Bet.push(`**${player1Mora.toLocaleString()}** ${getIcon('mora')}`)
            }
            if (player1Primo > 0) {
                player1Bet.push(`**${player1Primo.toLocaleString()}** ${getIcon('primo')}`)
            }
            if (player2Mora > 0) {
                player2Bet.push(`**${player2Mora.toLocaleString()}** ${getIcon('mora')}`)
            }
            if (player2Primo > 0) {
                player2Bet.push(`**${player2Primo.toLocaleString()}** ${getIcon('primo')}`)
            }

            const checkEmbed = new EmbedBuilder()
                .setTitle(`🔍 THÔNG TIN TRẬN ĐẤU: \`${duel.id}\``)
                .setColor(0x9b59b6)
                .addFields(
                    {
                        name: `Phe 1:`,
                        value: `<@${duel.player1.id}>`,
                        inline: true
                    },
                    {
                        name: `Phe 2:`,
                        value: `<@${duel.player2.id}>`,
                        inline: true
                    },
                    {
                        name: "Mức cược trận đấu",
                        value: `**${duel.bet.toLocaleString()} ${getIcon(duel.currency)}**`,
                        inline: false
                    }
                )
                .setFooter({ text: ".td cuoc <id> <1/2> <số tiền> <mora/primo> để đặt cược." });

            // Hiển thị danh sách người cược nếu có
            let betterList = "";
            betterList += `**Phe 1 (${betterSide1.length} người):**\n${player1Bet.length > 0 ? player1Bet.join(' và ') : 'Chưa có ai đặt cược'}\n`;
            betterList += `**Phe 2 (${betterSide2.length} người):**\n${player2Bet.length > 0 ? player2Bet.join(' và ') : 'Chưa có ai đặt cược'}\n`

            checkEmbed.addFields({ name: "Tổng số tiền đặt cược", value: betterList });

            return message.channel.send({ embeds: [checkEmbed] });
        }

        // ĐẶT CƯỢC (.td cuoc <id> <1/2> <số_tiền>)
        if (subCommand === 'cuoc') {
            const duelId = args[1];
            const side = args[2]; // "1" hoặc "2"
            const betAmount = parseInt(args[3]);
            const currencyType = args[4] ? args[4].toLowerCase() : 'mora';
            const allowedCurrencies = ['mora', 'primo'];

            if (!allowedCurrencies.includes(currencyType)) {
                return message.reply(`${errorIcon} Loại tiền không hợp lệ (mora/primo).`);
            }

            if (!duelId || !["1", "2"].includes(side) || isNaN(betAmount) || betAmount <= 0) {
                return message.reply("⚠️ Cách dùng: `.td cuoc <id> <1 hoặc 2> <số tiền> <loại tiền>`");
            }

            let pendingDuels = await getKey(dbKey) || [];
            const duel = pendingDuels.find(d => d.id === duelId);
            if (!duel) return message.reply(`${errorIcon} Không tìm thấy trận đấu.`);

            if(duel.status === 'closed'){
                return message.reply(`Trận đấu ${duelId} đã ngừng nhận cược.`);
            }

            if (message.author.id == duel.player1.id || message.author.id == duel.player2.id) {
                return message.reply(`${errorIcon} Bạn đang tham gia trận đấu không được đặt cược.`);
            }

            const listBet =  duel.betters || [];
            const checkBet = listBet.filter((b)=> b.userId == message.author.id && side === side);
            let betCheck = betAmount;

            for(const better of checkBet){
                if(better.currency == currencyType){
                    betCheck += better.amount
                }
            }

            if(betCheck > (currencyType == 'primo' ? maxPrimo : maxMora)){
                return message.reply(`Mức cược chỉ được tối đa ${currencyType == 'primo' ? maxPrimo.toLocaleString() : maxMora.toLocaleString()} ${getIcon(currencyType)}.`);
            }

            const userBal = await getBalance(message.author.id, currencyType) || 0;
            if (userBal < betAmount) return message.reply(`${errorIcon} Bạn không đủ ${getIcon(currencyType)} để đặt cược!`);

            // Trừ tiền người cược
            await removeMoney(message.author.id, betAmount, currencyType);

            // Lưu thông tin người cược vào trận đấu
            if (!duel.betters) { duel.betters = []; }
            duel.betters.push({
                userId: message.author.id,
                side: side,
                amount: betAmount,
                currency: currencyType
            });

            await setKey(dbKey, pendingDuels);
            return message.reply(`${verifyIcon} Bạn đã cược **${betAmount.toLocaleString()} ${getIcon(currencyType)}** cho bên **${side === "1" ? duel.player1.tag : duel.player2.tag}**.`);
        }

        // XỬ LÝ THẮNG THUA (Dành cho Admin/Dev)
        if (subCommand === 'win') {
            if (!DEVELOPER_IDS.includes(message.author.id)) return;

            const duelId = args[1];
            const winnerSelection = args[2];

            let pendingDuels = await getKey(dbKey) || [];
            const duelIndex = pendingDuels.findIndex(d => d.id === duelId);

            if (duelIndex === -1) return message.reply(`${errorIcon} Không tìm thấy ID trận đấu này.`);

            const duel = pendingDuels[duelIndex];
            let winnerId;
            let winnerSide;

            // Xác định người thắng theo 1, 2 hoặc tag
            if (winnerSelection === "1") {
                winnerId = duel.player1.id;
                winnerSide = "1";
            } else if (winnerSelection === "2") {
                winnerId = duel.player2.id;
                winnerSide = "2";
            } else {
                const mentionedWinner = message.mentions.users.first();
                if (mentionedWinner) {
                    winnerId = mentionedWinner.id;
                    winnerSide = winnerId === duel.player1.id ? "1" : (winnerId === duel.player2.id ? "2" : null);
                }
            }

            if (!winnerId || !winnerSide) {
                return message.reply("⚠️ Cách dùng: `.td win <id> <1 hoặc 2>`");
            }

            const betMsg = [];
            let totalWinningBetMora = 0;
            let totalWinningBetPrimo = 0;

            // 1. Trả thưởng X2 cho người cược đúng và gom quỹ hoa hồng 10%
            if (duel.betters && duel.betters.length > 0) {
                for (const better of duel.betters) {
                    if (better.side === winnerSide) {
                        if (better.currency === 'mora') {
                            totalWinningBetMora += better.amount;
                        } else {
                            totalWinningBetPrimo += better.amount;
                        }

                        const prizeBetter = better.amount * 2;
                        await addMoney(better.userId, prizeBetter, better.currency);
                        betMsg.push(`<@${better.userId}> nhận được **${prizeBetter.toLocaleString()}** ${getIcon(better.currency)}`);
                    }
                }
            }

            // 2. Tính toán tiền thưởng cho Đấu thủ thắng và Logic quy đổi Primo lẻ
            const basePrize = duel.bet * 2;

            // Tính hoa hồng 10% thô
            const rawCommMora = totalWinningBetMora * 0.1;
            const rawCommPrimo = totalWinningBetPrimo * 0.1;

            // Lấy phần nguyên của hoa hồng
            let finalCommMora = Math.floor(rawCommMora);
            let finalCommPrimo = Math.floor(rawCommPrimo);

            // XỬ LÝ QUY ĐỔI: Nếu hoa hồng Primo có phần lẻ, đổi sang Mora dựa trên exchangeRate
            const leftoverPrimo = rawCommPrimo - finalCommPrimo;
            if (leftoverPrimo > 0) {                
                const convertedMora = Math.floor(leftoverPrimo * exchangeRate);
                finalCommMora += convertedMora;
            }

            // Tổng tiền thưởng theo từng loại tiền cho đấu thủ
            const totalMoraPrize = (duel.currency === 'mora' ? basePrize : 0) + finalCommMora;
            const totalPrimoPrize = (duel.currency === 'primo' ? basePrize : 0) + finalCommPrimo;

            // 3. Thực hiện cộng tiền cho đấu thủ thắng
            if (totalMoraPrize > 0) { await addMoney(winnerId, totalMoraPrize, 'mora'); }
            if (totalPrimoPrize > 0) { await addMoney(winnerId, totalPrimoPrize, 'primo'); }

            // 4. Dọn dẹp dữ liệu trận đấu
            pendingDuels.splice(duelIndex, 1);
            await setKey(dbKey, pendingDuels);

            // 5. Chuẩn bị tin nhắn thông báo
            const prizeStrings = [];
            if (totalMoraPrize > 0) { prizeStrings.push(`**${totalMoraPrize.toLocaleString()}** ${getIcon('mora')}`); }
            if (totalPrimoPrize > 0) { prizeStrings.push(`**${totalPrimoPrize.toLocaleString()}** ${getIcon('primo')}`); }

            const winnerTag = winnerId === duel.player1.id ? `<@${duel.player1.id}>` : `<@${duel.player2.id}>`;
            const winnerInfo = `🏆 **${winnerTag}** thắng và nhận được ${prizeStrings.join(' và ')}.`;
            const betterInfo = betMsg.length > 0 ? `\n---\n**Người đặt cược thắng:**\n${betMsg.join('\n')}` : "";

            return message.reply(`Trận \`${duelId}\` đã hoàn thành!\n${winnerInfo}${betterInfo}`);
        }

        // KHỞI TẠO THÁCH ĐẤU   
        const target = message.mentions.users.first();
        const betAmount = parseInt(args[1]);
        const currencyType = args[2] ? args[2].toLowerCase() : 'mora';
        const allowedCurrencies = ['mora', 'primo'];

        if (subCommand == null) {
            return message.reply("**Hướng dẫn thách đấu:**\n" +
                "🔹 `.td @user <số tiền> <mora/primo>` để tạo trận.\n" +
                "🔹 `.td cuoc <id> <1/2> <số tiền> <mora/primo>` để đặt cược.\n" +
                "🔹 `.td list` để xem danh sách trận đang chờ.\n"+
                "🔹 `.td check <id>` để xem chi tiết trận đấu.\n"+
                "Chỉ dành cho dev\n"+
                "🔹 `.td dong <id>` để đóng trận đấu.\n"+
                "🔹 `.td huy <id>` để hủy trận đấu.\n"+
                "🔹 `.td win <id> <1/2>` để trao giải cho người thắng."
            );
        }

        if (!allowedCurrencies.includes(currencyType)) return message.reply(`${errorIcon} Loại tiền không hợp lệ (mora/primo).`);
        if (!target || target.id === message.author.id || target.bot) return message.reply("⚠️ Tag đối thủ hợp lệ!");
        if (isNaN(betAmount) || betAmount <= 0) return message.reply("⚠️ Nhập tiền cược hợp lệ!");

        // 1. Kiểm tra số dư ban đầu của cả hai người
        const authBal = await getBalance(message.author.id, currencyType) || 0;
        const tarBal = await getBalance(target.id, currencyType) || 0;

        if (authBal < betAmount) { return message.reply(`${errorIcon} Bạn không đủ **${betAmount.toLocaleString()} ${getIcon(currencyType)}** để tạo thách đấu!`); }
        if (tarBal < betAmount) { return message.reply(`${errorIcon} **${target.tag}** không đủ **${betAmount.toLocaleString()} ${getIcon(currencyType)}** để theo kèo!`); }

        // 2. Tạo nút xác nhận
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_duel')
                    .setLabel('Chấp Nhận')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('decline_duel')
                    .setLabel('Từ Chối')
                    .setStyle(ButtonStyle.Danger),
            );

        const inviteEmbed = new EmbedBuilder()
            .setTitle("⚔️ LỜI MỜI THÁCH ĐẤU")
            .setDescription(`**<@${message.author.id}>** thách đấu **<@${target.id}>**!\n💰 Mức cược: **${betAmount.toLocaleString()} ${getIcon(currencyType)}**\n\n*Người được thách đấu có 60 giây để phản hồi.*`)
            .setColor(0x5865F2);

        const response = await message.channel.send({
            content: `${target}`,
            embeds: [inviteEmbed],
            components: [row]
        });

        // 3. Chờ phản hồi từ người bị thách đấu
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== target.id) {
                return i.reply({ content: `${errorIcon} Chỉ người được thách đấu mới có thể nhấn nút này!`, ephemeral: true });
            }

            if (i.customId === 'decline_duel') {
                await i.update({ content: `🚫 **${target.tag}** đã từ chối lời thách đấu.`, embeds: [], components: [] });
                return collector.stop('declined');
            }

            if (i.customId === 'confirm_duel') {
                // Kiểm tra lại số dư một lần nữa trước khi trừ tiền (tránh trường hợp tiêu sạch tiền trong 60s chờ)
                const finalAuthBal = await getBalance(message.author.id, currencyType) || 0;
                const finalTarBal = await getBalance(target.id, currencyType) || 0;

                if (finalAuthBal < betAmount || finalTarBal < betAmount) {
                    await i.update({ content: `${errorIcon} Giao dịch thất bại: Một trong hai người không còn đủ tiền cược!`, embeds: [], components: [] });
                    return collector.stop('insufficient_funds');
                }

                // 4. Thực hiện trừ tiền sau khi đã nhấn đồng ý
                await removeMoney(message.author.id, betAmount, currencyType);
                await removeMoney(target.id, betAmount, currencyType);

                let pendingDuels = await getKey(dbKey) || [];
                const duelId = Date.now().toString().slice(-6);

                pendingDuels.push({
                    id: duelId,
                    player1: { id: message.author.id, tag: message.author.tag },
                    player2: { id: target.id, tag: target.tag },
                    bet: betAmount,
                    currency: currencyType,
                    betters: [],
                    status:'open'
                });

                await setKey(dbKey, pendingDuels);

                const startEmbed = new EmbedBuilder()
                    .setTitle("⚔️ KÈO THÁCH ĐẤU ĐÃ LÊN")
                    .setDescription(`ID: \`${duelId}\`\n**1. <@${message.author.id}>** \n**2. <@${target.id}>** \nCược mỗi bên: **${betAmount.toLocaleString()} ${getIcon(currencyType)}**`)
                    .setFooter({ text: "Người xem có thể đặt cược bằng lệnh .td cuoc" })
                    .setColor(0xf1c40f);

                await i.update({ content: "Thách đấu đã được khởi tạo!", embeds: [startEmbed], components: [] });
                collector.stop('confirmed');
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                response.edit({ content: "⏰ Đã hết thời gian chờ, lời mời thách đấu đã hủy.", embeds: [], components: [] }).catch(() => { });
            }
        });
    }
};