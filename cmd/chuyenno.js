const { addMoney, getIcon } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, getKey, setKey, pushKey } = require('../utils/db.js'); 
const { DEVELOPER_IDS } = require('../utils/constant.js'); 
const { calculateInterest } = require('../utils/constant.js');

module.exports = {
    name: 'chuyenno',
    aliases: ['cn', 'convertloan'],
    description: 'Trả tiền cho chủ nợ và chuyển nợ thành biên bản vi phạm.',
    
    async execute(message, args) {
        try {
            // 1. Kiểm tra quyền Developer
            const isDev = DEVELOPER_IDS.includes(message.author.id);
            if (!isDev) {
                return message.reply(`${errorIcon} | Chỉ Developer mới có quyền sử dụng lệnh này.`);
            }

            // 2. Xác định đối tượng và STT
            const targetUser = message.mentions.users.first();
            const loanIndexStr = args[1]; 

            if (!targetUser || !loanIndexStr) {
                return message.reply(`⚠️ Cách dùng: \`.chuyenno @user <STT>\``);
            }

            const loanKey = renderKey("loan", message.guild.id);
            const bbKey = renderKey("bienban", message.guild.id);
            let allLoans = (await getKey(loanKey)) || [];

            // 3. Tìm khoản nợ cụ thể
            const userLoans = allLoans.filter(l => l.nguoi_vay === targetUser.id);
            const loanIndex = parseInt(loanIndexStr) - 1;

            if (userLoans.length === 0 || !userLoans[loanIndex]) {
                return message.reply(`${errorIcon} | Không tìm thấy khoản nợ này.`);
            }

            const targetLoan = userLoans[loanIndex];
            const currencyType = 'mora';

            // 4. Tính toán Gốc + Lãi tại thời điểm hiện tại
            const { rate: interestRate, days: diffDays } = calculateInterest(targetLoan.date);
            const totalAmount = Math.round(targetLoan.money * (1 + interestRate));

            // === BƯỚC QUAN TRỌNG: TRẢ TIỀN CHO CHỦ NỢ ===
            // Hệ thống sẽ cộng tiền cho người cho vay (nguoi_cho_vay)
            await addMoney(targetLoan.nguoi_cho_vay, totalAmount, currencyType);

            // 5. Chuyển số tiền đó thành biên bản cho người vay
            await pushKey(bbKey, {
                userId: targetUser.id,
                date: new Date().toISOString(), 
                money: totalAmount,
            });

            // 6. Xóa khoản nợ cũ
            const updatedAllLoans = allLoans.filter(l => l !== targetLoan);
            await setKey(loanKey, updatedAllLoans);

            // 7. Thông báo
            return message.channel.send({
                embeds: [{
                    title: `⚖️ LỆNH CHUYỂN ĐỔI NỢ & TẤT TOÁN`,
                    color: 0x00FFFF,
                    description: `Hệ thống đã thực hiện chuyển đổi nợ cho <@${targetUser.id}>.\n\n` +
                                 `> 👤 **Chủ nợ:** <@${targetLoan.nguoi_cho_vay}> đã được nhận **${totalAmount.toLocaleString()}** ${getIcon(currencyType)}\n` +
                                 `> 📝 Khoản nợ đã chuyển thành **Biên bản vi phạm**.\n` +
                                 `> 📈 **Chi tiết:** Bao gồm gốc và lãi tích lũy trong ${diffDays} ngày.`
                }]
            });

        } catch (error) {
            console.error("LỖI LỆNH CHUYENNO:", error);
            return message.reply(`${errorIcon} | Lỗi khi xử lý giao dịch.`);
        }
    },
};