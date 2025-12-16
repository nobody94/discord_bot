const Money = require('../utils/currency');

module.exports = {
    name: 'balance', 
    description: 'Kiểm tra số tiền của bạn.',
    aliases: ['tien', 'money', 'bal','mn'],
    async execute(message, args) {
        // Lấy User ID của người dùng đã gõ lệnh
        const userId = message.author.id;
        
        // Gọi hàm để lấy số dư
        const currentBalance = await Money.getBalance(userId); 
        
        message.reply(`💰 | Số tiền hiện tại của bạn là: **${currentBalance}** ${Money.currency}.`);
    },
};