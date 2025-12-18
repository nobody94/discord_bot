const { EmbedBuilder } = require('discord.js');
const { getIcon } = require('../utils/currency');
const { SHOP_ITEMS } = require('../utils/shop');

module.exports = {
    name: 'shop',
    description: 'Xem danh sách vật phẩm.',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('🏪 CỬA HÀNG TEYVAT')
            .setColor(0x00FF99)            
            .setDescription('Sử dụng lệnh `.buy <ID>` để mua đồ.');

        for (const [id, item] of Object.entries(SHOP_ITEMS)) {
            embed.addFields({
                name: `${item.icon} ${item.name} (ID: \`${id}\`)`,
                value: `Giá: **${item.price.toLocaleString()}** ${getIcon(item.currency)}\n*${item.description}*`
            });
        }

        message.reply({ embeds: [embed] });
    }
};