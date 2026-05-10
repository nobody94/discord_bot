const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getIcon } = require('../utils/currency');
const { SHOP_ITEMS, type } = require('../utils/weaponshop');

module.exports = {
    name: 'weaponshop',
    aliases: ['wshop'],
    description: 'Xem danh sách vật phẩm theo trang.',
    async execute(message) {
        const availableItems = Object.entries(SHOP_ITEMS).filter(([id, item]) => !item.hideFromShop);
        const itemsPerPage = 5; // Số lượng đồ vật hiển thị trên 1 trang
        const totalPages = Math.ceil(availableItems.length / itemsPerPage);
        let currentPage = 0;

        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle('🔫 Chợ đen')
                .setColor(0x00FF99)
                .setDescription('Sử dụng lệnh `.wshop buy <ID> <số lượng>` để mua đồ.')
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