const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { SHOP_ITEMS, type } = require('../utils/blackmarket');
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { getBalance, removeMoney, getIcon, checkPay } = require("../utils/currency");
const { renderKey, setKey, getKey } = require("../utils/db");

module.exports = {
    name: 'blackmarket',
    aliases: ['bmk', 'choden'],
    description: 'Xem danh sách vật phẩm theo trang.',
    async execute(message,args) {
        if (args[0]?.toLowerCase() === 'buy') {
            const userId = message.author.id;
            const itemId = args[1]?.toLowerCase();
            const amount = parseInt(args[2]) || 1;

            if (!itemId) {
                return message.reply(
                    `${errorIcon} | Vui lòng nhập ID vật phẩm. Ví dụ: \`.bmk buy brick 2\``,
                );
            }

            const item = SHOP_ITEMS[itemId];

            if (!item || item.hideFromShop === true) {
                return message.reply(
                    `${errorIcon} | Vật phẩm này không tồn tại hoặc không bán trực tiếp!`,
                );
            }

            if (amount <= 0) {
                return message.reply(`${errorIcon} | Số lượng mua phải lớn hơn 0!`);
            }

            if (item.maxAmount && amount > item.maxAmount) {
                return message.reply(`${errorIcon} | Số lượng mua không được quá ${item.maxAmount}!`);
            }

            const totalPrice = item.price * amount;
            const userBalance = await getBalance(userId, item.currency);

            if (userBalance < totalPrice) {
                return message.reply(
                    `💸 | Bạn cần **${totalPrice.toLocaleString()}** ${getIcon(item.currency)} để mua **${amount}x** ${item.icon} **${item.name}**.`,
                );
            }

            const isBlocked = await checkPay(message, userId);
            if (isBlocked) return;

            try {
                // 5. Thực hiện trừ tiền
                const success = await removeMoney(userId, totalPrice, item.currency);

                if (success) {
                    const invKey = renderKey("trunk", userId);
                    
                    const currentInv = (await getKey(invKey)) || [];
                    for (let i = 0; i < amount; i++) {
                        currentInv.push(itemId);
                    }
                    await setKey(invKey, currentInv);

                    return message.reply({
                        content: `${verifyIcon} | Chúc mừng! Bạn đã mua thành công **${amount}x** ${item.icon} **${item.name}** với tổng giá **${totalPrice.toLocaleString()}** ${getIcon(item.currency)}.\n📦 Gõ \`.trunk\` để kiểm tra.`,
                    });
                } else {
                    return message.reply(
                        `${errorIcon} | Giao dịch thất bại do lỗi hệ thống.`,
                    );
                }
            } catch (error) {
                console.error("LỖI KHI MUA ĐỒ:", error);
                return message.reply(
                    `${errorIcon} | Hệ thống gặp lỗi khi xử lý giao dịch.`,
                );
            }
        }

        const availableItems = Object.entries(SHOP_ITEMS).filter(([id, item]) => !item.hideFromShop);
        const itemsPerPage = 5;
        const totalPages = Math.ceil(availableItems.length / itemsPerPage);
        let currentPage = 0;

        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle('🔫 Chợ đen')
                .setColor(0x2E0854)
                .setDescription('Sử dụng lệnh `.bmk buy <ID> <số lượng>` để mua đồ.')
                .setFooter({ text: `Trang ${page + 1}/${totalPages}` });

            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = availableItems.slice(start, end);

            pageItems.forEach(([id, item]) => {
                let message = `Giá: **${item.price.toLocaleString()}** ${getIcon(item.currency)}`;

                if (item.type == type.damage) {
                    message += `\n⚔️ Sát thương: \`${item.minDmg} - ${item.maxDmg}\`HP`;
                }

                if (item.type == type.healing) {
                    message += `\n💚 Hồi phục: \`${item.minHeal} - ${item.maxHeal}\`HP`;
                }

                if (item.type == type.revive) {
                    message += `\n❤️ Hồi sinh: \`${item.minHealOther} - ${item.maxHealOther}\`HP`;
                }

                message += `\n*${item.description}*`

                embed.addFields({
                    name: `${item.icon} ${item.name} (ID: \`${id}\`)`,
                    value: message,
                    inline: false
                });
            });

            return embed;
        };

        // Hàm tạo nút bấm
        const createButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Trang trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Trang sau')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1)
            );
        };

        const response = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: [createButtons(currentPage)]
        });

        // 3. Lắng nghe tương tác nút bấm (Collector)
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // Sau 60 giây nút sẽ hết hạn
        });

        collector.on('collect', async (interaction) => {
            // Chỉ người dùng gọi lệnh mới có thể nhấn nút
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "Bạn không thể điều khiển bảng này!", ephemeral: true });
            }

            if (interaction.customId === 'prev_page') {
                currentPage--;
            } else if (interaction.customId === 'next_page') {
                currentPage++;
            }

            await interaction.update({
                embeds: [createEmbed(currentPage)],
                components: [createButtons(currentPage)]
            });
        });

        // Khi hết thời gian, vô hiệu hóa các nút
        collector.on('end', () => {
            const disabledButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('p').setLabel('Trang trước').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('n').setLabel('Trang sau').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            response.edit({ components: [disabledButtons] }).catch(() => null);
        });
    }
}