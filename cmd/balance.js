const Money = require('../utils/currency');

module.exports = {
    name: 'balance', 
    description: 'Kiểm tra số dư của bạn.',
    aliases: ['tien', 'money', 'cash'],

    async execute(message, args) {
        // 1. Xác định ID người dùng (Hỗ trợ xem hộ tiền của người khác nếu họ @mention)
        let targetId = message.author.id;
        let targetUser = message.author;

        if (args[0]) {
            // Xử lý lấy ID từ mention <@123...>
            let mentionId = args[0].replace(/[<@!>]/g, '');
            if (/^\d+$/.test(mentionId)) {
                try {
                    const fetchedUser = await message.client.users.fetch(mentionId);
                    targetId = mentionId;
                    targetUser = fetchedUser;
                } catch (e) {
                    // Nếu không fetch được thì giữ nguyên là bản thân
                }
            }
        }

        // 2. Gọi hàm lấy tất cả số dư (trả về Object { mora: 100, primo: 50 })
        const balances = await Money.getAllBalances(targetId); 
        
        // 3. Xây dựng nội dung tin nhắn hiển thị
        // Chúng ta lặp qua danh sách CURRENCIES để đảm bảo hiển thị đúng Icon và tên
        const balanceEntries = Object.keys(Money.CURRENCIES).map(type => {
            const amount = balances[type] || 0;
            const icon = Money.getIcon(type);
            
            return `${icon} *:** \`${amount.toLocaleString()}\``;
        });

        const responseEmbed = {
            color: 0x00ff00,
            author: {
                name: `Tài sản của ${targetUser.username}`,
                icon_url: targetUser.displayAvatarURL()
            },
            description: balanceEntries.join('\n'),
            timestamp: new Date(),
            footer: {
                text: 'Hệ thống ngân hàng Teyvat'
            }
        };

        // 4. Phản hồi tin nhắn
        return message.reply({ embeds: [responseEmbed] });
    },
};