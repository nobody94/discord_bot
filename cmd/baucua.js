const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { baucuaIcon,verifyIcon,errorIcon } = require("../utils/icon");
const Money = require('../utils/currency');
const {maxAmount} = require('../utils/constant');

const baucuaLabel = {
    bau: { icon: baucuaIcon.bau, label: "bầu" },
    cua: { icon: baucuaIcon.cua, label: 'cua' },
    tom: { icon: baucuaIcon.tom, label: 'tôm' },
    ca: { icon: baucuaIcon.ca, label: 'cá' },
    ga: { icon: baucuaIcon.ga, label: 'gà' },
    nai: { icon: baucuaIcon.nai, label: 'nai' }
};

// Lưu trữ các phiên cược đang diễn ra
const activeGames = new Map();

function quayBauCua() {
    const keys = Object.keys(baucuaIcon);
    return [
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)]
    ];
}

module.exports = {
    name: "baucua",
    aliases: ["bc"],
    async execute(message) {
        const guildId = message.guild.id;

        if (activeGames.has(guildId)) {
            return message.reply("Một phiên cược đang diễn ra, hãy nhấn vào các nút ở trên để tham gia!");
        }

        // Thiết lập thời gian kết thúc (30 giây từ hiện tại)
        const duration = 30000;
        const endTime = Date.now() + duration;
        
        // Tạo Discord Timestamp (chia 1000 để đổi sang giây)
        // Định dạng <t:TIMESTAMP:R> sẽ hiển thị: "trong 30 giây" và tự đếm ngược
        const discordTimestamp = Math.floor(endTime / 1000);

        activeGames.set(guildId, {
            players: [], 
            endTime: endTime
        });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bc_bau').setLabel('Bầu').setEmoji(baucuaIcon.bau).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bc_cua').setLabel('Cua').setEmoji(baucuaIcon.cua).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bc_tom').setLabel('Tôm').setEmoji(baucuaIcon.tom).setStyle(ButtonStyle.Primary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bc_ca').setLabel('Cá').setEmoji(baucuaIcon.ca).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bc_ga').setLabel('Gà').setEmoji(baucuaIcon.ga).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bc_nai').setLabel('Nai').setEmoji(baucuaIcon.nai).setStyle(ButtonStyle.Primary)
        );

        const mainMsg = await message.channel.send({
            content: `🎲 **PHIÊN CƯỢC BẦU CUA BẮT ĐẦU** 🎲\n` +
                     `Kết thúc cược: <t:${discordTimestamp}:R>\n` + // Đồng hồ đếm ngược tự động ở đây
                     `(Tối đa ${maxAmount} ${Money.getIcon()} mỗi lượt)`,
            components: [row1, row2]
        });

        // Xử lý kết thúc sau 30 giây
        setTimeout(async () => {
            const gameData = activeGames.get(guildId);
            if (!gameData) return;
            activeGames.delete(guildId);

            // Vô hiệu hóa nút bấm
            const disabledRows = [row1, row2].map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components.forEach(c => c.setDisabled(true));
                return newRow;
            });
            
            await mainMsg.edit({ content: "⌛ **Đã hết thời gian đặt cược! Đang lắc...**", components: disabledRows });

            // Hiệu ứng lắc (2 giây)
            await new Promise(r => setTimeout(r, 2000));

            const results = quayBauCua(); //
            const icons = results.map(r => baucuaIcon[r]); //
            
            let resultSummary = `🎲 Kết quả: **${icons.join(" | ")}** 🎲\n\n`; //
            let winnersText = "";

            if (gameData.players.length === 0) {
                resultSummary += "Không có ai tham gia phiên này."; //
            } else {
                for (const player of gameData.players) {
                    const matchCount = results.filter(r => r === player.choice).length; //
                    if (matchCount > 0) {
                        const winAmount = player.amount + (matchCount * player.amount); //
                        await Money.addMoney(player.userId, winAmount); //
                        winnersText += `${verifyIcon} **${player.userName}** lụm **${winAmount.toLocaleString()}** ${Money.getIcon()} (${player.choice})\n`; //
                    } else {
                        winnersText += `${errorIcon} **${player.userName}** toạch **${player.amount.toLocaleString()}** ${Money.getIcon()} (${player.choice})\n`; //
                    }
                }
            }

            await mainMsg.edit({ content: resultSummary + (winnersText || "") });
        }, duration);
    },

    async handleInteraction(interaction) {
        const guildId = interaction.guild.id;

        if (interaction.isButton()) {
            if (!activeGames.has(guildId)) {
                return interaction.reply({ content: "Phiên cược này đã kết thúc!", ephemeral: true });
            }
            const animal = interaction.customId.split("_")[1];
            const modal = new ModalBuilder()
                .setCustomId(`modal_bc_${animal}`)
                .setTitle(`Đặt cược: ${baucuaLabel[animal].label.toUpperCase()}`);

            const moneyInput = new TextInputBuilder()
                .setCustomId("bet_amount")
                .setLabel(`Nhập số Mora cược (Tối đa ${maxAmount}):`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(moneyInput));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit()) {
            const gameData = activeGames.get(guildId);
            if (!gameData) return interaction.reply({ content: "Hết thời gian đặt cược!", ephemeral: true });

            const animalChoice = interaction.customId.split("_")[2];
            const betAmount = parseInt(interaction.fields.getTextInputValue("bet_amount"));
            const userId = interaction.user.id;

            if (isNaN(betAmount) || betAmount <= 0 || betAmount > 10000) {
                return interaction.reply({ content: `Tiền cược không hợp lệ (1 - ${maxAmount})!`, ephemeral: true });
            }

            const balance = await Money.getBalance(userId);
            if (balance < betAmount) {
                return interaction.reply({ content: "Bạn không đủ tiền!", ephemeral: true });
            }

            // Trừ tiền ngay khi đặt cược
            await Money.removeMoney(userId, betAmount);
            gameData.players.push({
                userId,
                userName: interaction.user.username,
                choice: animalChoice,
                amount: betAmount
            });

            await interaction.reply({ content: `Bạn đã cược **${betAmount.toLocaleString()}** vào **${baucuaLabel[animalChoice].label}**!`, ephemeral: true });
        }
    }
};