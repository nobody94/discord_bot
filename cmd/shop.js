const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getIcon } = require('../utils/currency');
const { SHOP_ITEMS } = require('../utils/shop');

module.exports = {
    name: 'shop',
    description: 'Xem danh sách vật phẩm theo trang.',
    async execute(message) {
        // 1. Lọc danh sách vật phẩm không bị ẩn
        const availableItems = Object.entries(SHOP_ITEMS).filter(([id, item]) => !item.hideFromShop);
        
        // 2. Cấu hình phân trang
        const itemsPerPage = 5; // Số lượng đồ vật hiển thị trên 1 trang
        const totalPages = Math.ceil(availableItems.length / itemsPerPage);
        let currentPage = 0;

        // Hàm tạo Embed cho từng trang
        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle('<:store:1451465383436615731> TẠP HÓA KATHERINE')
                .setColor(0x00FF99)
                .setDescription('Sử dụng lệnh `.buy <ID> <số lượng>` để mua đồ.')
                .setFooter({ text: `Trang ${page + 1}/${totalPages}` });

            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = availableItems.slice(start, end);

            pageItems.forEach(([id, item]) => {
                embed.addFields({
                    name: `${item.icon} ${item.name} (ID: \`${id}\`)`,
                    value: `Giá: **${item.price.toLocaleString()}** ${getIcon(item.currency)}\n*${item.description}*${item.lovePoint ? `\nĐiểm thân mật: ${item.lovePoint}` : ''}`,
                    inline: false // Để mỗi món chiếm 1 hàng cho dễ nhìn
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
};