const Money = require('../utils/currency');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'balance', 
    description: 'Kiểm tra số dư của bạn hoặc người khác.',
    aliases: ['tien', 'cash', 'bal'],

    async execute(message, args) {
        // 1. Xác định đối tượng mục tiêu
        // Ưu tiên: Người được tag -> ID người dùng -> Bản thân người gõ lệnh
        let targetUser = message.mentions.users.first();
        
        if (!targetUser && args[0]) {
            const mentionId = args[0].replace(/[<@!>]/g, '');
            if (/^\d+$/.test(mentionId)) {
                try {
                    targetUser = await message.client.users.fetch(mentionId);
                } catch (e) {
                    // Nếu ID không hợp lệ, targetUser vẫn là null
                }
            }
        }

        // Nếu không có tag và không có ID hợp lệ, xem chính mình
        if (!targetUser) targetUser = message.author;

        // 2. Lấy dữ liệu tài chính từ Database
        const balances = await Money.getAllBalances(targetUser.id); 
        
        // 3. Xây dựng danh sách hiển thị các loại tiền
        const balanceEntries = Object.keys(Money.CURRENCIES).map(type => {
            const amount = balances[type] || 0;
            const icon = Money.getIcon(type);
            return `${icon} : **${amount.toLocaleString()}**`;
        });

        // 4. Tạo Embed hiển thị chuyên nghiệp hơn
        const responseEmbed = new EmbedBuilder()
            .setColor(targetUser.id === message.author.id ? 0x00ff00 : 0x3498db)
            .setAuthor({
                name: `Tài sản của ${targetUser.username}`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            })
            .setDescription(balanceEntries.join('\n'))
            .setTimestamp()
            .setFooter({ text: 'Hệ thống ngân hàng Teyvat' });

        // 5. Phản hồi
        return message.reply({ embeds: [responseEmbed] });
    },
};