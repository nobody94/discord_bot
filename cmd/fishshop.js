const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getIcon, getBalance, removeMoney } = require('../utils/currency');
const { FISH_SHOP_ITEMS } = require('../utils/fish.js');
const { renderKey, setKey, getKey } = require('../utils/db');
const { errorIcon, verifyIcon } = require('../utils/icon.js');

module.exports = {
    name: 'fishshop',
    aliases: ['cuahangca', 'fs'],
    description: 'Cửa hàng dụng cụ câu cá với hệ thống khởi tạo độ bền.',
    async execute(message, args) {
        const userId = message.author.id;

        if (args[0]?.toLowerCase() === 'buy') {
            const itemId = args[1]?.toLowerCase();
            const amount = parseInt(args[2]) || 1;

            if (!itemId) return message.reply(`${errorIcon} | Cú pháp: \`.fs buy <ID> <số lượng>\`.`);
            if (amount <= 0 || isNaN(amount)) return message.reply(`${errorIcon} | Số lượng không hợp lệ!`);

            const item = FISH_SHOP_ITEMS[itemId];
            if (!item) return message.reply(`${errorIcon} | Vật phẩm \`${itemId}\` không tồn tại!`);

            const totalPrice = item.price * amount;
            const userBalance = await getBalance(userId, item.currency);

            if (userBalance < totalPrice) {
                return message.reply(`💸 | Thiếu **${(totalPrice - userBalance).toLocaleString()}** ${getIcon(item.currency)}.`);
            }

            try {
                const success = await removeMoney(userId, totalPrice, item.currency);
                if (success) {
                    const invKey = renderKey('fish_inv', userId);
                    const currentInv = (await getKey(invKey)) || [];
                    
                    for (let i = 0; i < amount; i++) {
                        // Nếu là cần câu: Lưu Object kèm Durability
                        if (itemId.includes("cancau")) {
                            currentInv.push({
                                id: itemId,
                                durability: item.maxDurability // Khởi tạo độ bền tối đa
                            });
                        } else {
                            // Nếu là mồi: Lưu ID String bình thường
                            currentInv.push(itemId);
                        }
                    }
                    await setKey(invKey, currentInv);
                    return message.reply(`${verifyIcon} | Đã mua **${amount}x** ${item.icon} **${item.name}**!`);
                }
            } catch (error) {
                console.error(error);
                return message.reply(`${errorIcon} | Lỗi xử lý giao dịch.`);
            }
        }

        // --- HIỂN THỊ DANH SÁCH SHOP ---
        const availableItems = Object.entries(FISH_SHOP_ITEMS);
        const itemsPerPage = 5;
        const totalPages = Math.ceil(availableItems.length / itemsPerPage);
        let currentPage = 0;

        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle('🎣 CỬA HÀNG DỤNG CỤ CÂU CÁ')
                .setColor(0x3498db)
                .setDescription('Dùng `.fs buy <ID> <SL>` để mua.')
                .setFooter({ text: `Trang ${page + 1}/${totalPages}` });

            const pageItems = availableItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
            pageItems.forEach(([id, item]) => {
                const durInfo = item.maxDurability ? `\nĐộ bền: **${item.maxDurability}**` : "";
                embed.addFields({
                    name: `${item.icon} ${item.name} (ID: \`${id}\`)`,
                    value: `Giá: **${item.price.toLocaleString()}** ${getIcon(item.currency)}${durInfo}\n*${item.description}*`,
                    inline: false
                });
            });
            return embed;
        };

        const createButtons = (page) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fs_prev').setLabel('⬅️').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('fs_next').setLabel('➡️').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
        );

        const response = await message.reply({ embeds: [createEmbed(currentPage)], components: [createButtons(currentPage)] });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== userId) return i.reply({ content: "Không phải của bạn!", ephemeral: true });
            i.customId === 'fs_prev' ? currentPage-- : currentPage++;
            await i.update({ embeds: [createEmbed(currentPage)], components: [createButtons(currentPage)] });
        });
    }
};