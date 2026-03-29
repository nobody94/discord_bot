const { addMoney, removeMoney, getIcon, getBalance } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, getKey, setKey } = require('../utils/db.js'); 
const { DEVELOPER_IDS } = require('../utils/constant.js'); // Lấy danh sách ID Dev

module.exports = {
    name: 'battrano',
    aliases: ['eptra', 'fpay'],
    description: 'Quyền Dev: Ép một người dùng trả nợ (trừ tiền trực tiếp).',
    
    async execute(message, args) {
        try {
            // 1. Kiểm tra quyền Developer
            if (!DEVELOPER_IDS.includes(message.author.id)) {
                return message.reply(`${errorIcon} | Chỉ Developer mới có quyền sử dụng lệnh này.`);
            }

            // 2. Xác định người bị ép trả nợ
            const targetUser = message.mentions.users.first();
            const loanIndexStr = args[1]; // STT khoản nợ

            if (!targetUser || !loanIndexStr) {
                return message.reply(`⚠️ Cách dùng: \`.eptra @user <STT>\``);
            }

            const loanKey = renderKey("loan", message.guild.id);
            let allLoans = (await getKey(loanKey)) || [];

            // 3. Tìm các khoản nợ của người bị tag
            const userLoans = allLoans.filter(l => l.nguoi_vay === targetUser.id);
            const loanIndex = parseInt(loanIndexStr) - 1;

            if (userLoans.length === 0 || !userLoans[loanIndex]) {
                return message.reply(`${errorIcon} | Người dùng này không có khoản nợ nào ở STT này.`);
            }

            const targetLoan = userLoans[loanIndex];
            const currencyType = 'mora';

            // 4. Tính toán tổng nợ (Gốc + Lãi)
            const startDate = new Date(targetLoan.date);
            const diffDays = Math.ceil(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24)) || 1;

            let interestRate = diffDays >= 7 ? 0.10 : (diffDays >= 3 ? 0.05 : 0.02);
            const totalToPay = Math.round(targetLoan.money * (1 + interestRate));

            // 5. Kiểm tra ví người vay (Nếu không đủ tiền vẫn trừ về 0 hoặc âm tùy logic server của bạn)
            const victimBalance = await getBalance(targetUser.id, currencyType);
            if (victimBalance < totalToPay) {
                return message.reply(`${errorIcon} | <@${targetUser.id}> không đủ tiền trong ví (**${victimBalance.toLocaleString()}**) để thanh toán khoản nợ **${totalToPay.toLocaleString()}**${getIcon(currencyType)}.`);
            }

            // 6. Thực hiện cưỡng chế giao dịch
            await removeMoney(targetUser.id, totalToPay, currencyType);
            await addMoney(targetLoan.nguoi_cho_vay, totalToPay, currencyType);

            // 7. Cập nhật Database (Xóa khoản nợ vì đã ép trả hết)
            const updatedAllLoans = allLoans.filter(l => l !== targetLoan);
            await setKey(loanKey, updatedAllLoans);

            // 8. Thông báo
            return message.channel.send({
                content: `🚨 **LỆNH CƯỠNG CHẾ TÀI CHÍNH**`,
                embeds: [{
                    color: 0xFF0000,
                    description: `Developer ${message.author} đã ép <@${targetUser.id}> trả nợ.\n\n` +
                                 `> 👤 Chủ nợ nhận: **${totalToPay.toLocaleString()}** ${getIcon(currencyType)}\n` +
                                 `> 📉 Lãi suất áp dụng: **${(interestRate * 100)}%**\n` +
                                 `> ✅ Trạng thái: **Đã xóa khoản nợ khỏi hệ thống.**`
                }]
            });

        } catch (error) {
            console.error("LỖI LỆNH FORCETRANO:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi khi thực hiện lệnh cưỡng chế.`);
        }
    },
};