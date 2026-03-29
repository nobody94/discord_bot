const { addMoney, removeMoney, getIcon, getBalance } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, getKey, setKey } = require('../utils/db.js'); 

module.exports = {
    name: 'trano',
    aliases: ['pay', 'tra'],
    description: 'Trả nợ toàn bộ hoặc một phần với lãi suất tính trên số tiền thực trả.',
    
    async execute(message, args) {
        try {
            // 1. Lấy dữ liệu khoản vay từ database
            const loanKey = renderKey("loan", message.guild.id);
            let allLoans = (await getKey(loanKey)) || [];

            // 2. Lọc danh sách nợ của người gửi lệnh
            const myLoans = allLoans.filter(l => l.nguoi_vay === message.author.id);

            if (myLoans.length === 0) {
                return message.reply(`${errorIcon} | Bạn không có khoản nợ nào cần trả.`);
            }

            // 3. Kiểm tra tham số đầu vào (STT và Số tiền)
            const loanIndex = parseInt(args[0]) - 1;
            const inputAmount = parseInt(args[1]); // Số tiền người dùng muốn bỏ ra (bao gồm cả gốc + lãi)

            if (isNaN(loanIndex) || !myLoans[loanIndex]) {
                let list = myLoans.map((l, i) => {
                    const dateDisplay = !isNaN(new Date(l.date)) ? new Date(l.date).toLocaleDateString('vi-VN') : l.date;
                    return `**${i + 1}.** Nợ <@${l.nguoi_cho_vay}>: **${l.money.toLocaleString()}** ${getIcon('mora')} (Ngày: \`${dateDisplay}\`)`;
                }).join('\n');
                return message.reply(`⚠️ Cách dùng: \`.trano <STT> [số tiền]\`\n${list}`);
            }

            const targetLoan = myLoans[loanIndex];
            const currencyType = 'mora';

            // 4. Tính toán lãi suất dựa trên thời gian
            const startDate = new Date(targetLoan.date);
            const diffDays = Math.ceil(Math.abs(new Date() - startDate) / (1000 * 60 * 60 * 24)) || 1;

            let interestRate = 0;
            if (diffDays >= 7) interestRate = 0.10;      // >= 7 ngày lãi 10%
            else if (diffDays >= 3) interestRate = 0.05; // >= 3 ngày lãi 5%
            else interestRate = 0.02;                    // < 3 ngày lãi 2%

            // 5. Xác định số tiền thanh toán thực tế
            // Tổng số tiền cần để xóa sạch nợ (Gốc + Lãi toàn bộ)
            const maxTotalToPay = Math.round(targetLoan.money * (1 + interestRate));
            
            // Nếu người dùng không nhập số tiền hoặc nhập nhiều hơn tổng nợ, mặc định trả hết
            let finalAmountToPay = (isNaN(inputAmount) || inputAmount <= 0 || inputAmount >= maxTotalToPay) 
                ? maxTotalToPay 
                : inputAmount;

            // 6. Tính toán phân bổ Gốc và Lãi
            // Công thức: Tiền gốc thực = Tổng chi / (1 + lãi suất)
            const realPrincipalPaid = Math.round(finalAmountToPay / (1 + interestRate));
            const realInterestPaid = finalAmountToPay - realPrincipalPaid;

            // 7. Kiểm tra số dư người trả
            const myBalance = await getBalance(message.author.id, currencyType);
            if (myBalance < finalAmountToPay) {
                return message.reply(`${errorIcon} | Bạn không đủ tiền. Cần **${finalAmountToPay.toLocaleString()}** ${getIcon(currencyType)} để thực hiện giao dịch này.`);
            }

            // 8. Thực hiện giao dịch tiền tệ
            await removeMoney(message.author.id, finalAmountToPay, currencyType);
            await addMoney(targetLoan.nguoi_cho_vay, finalAmountToPay, currencyType);

            // 9. Cập nhật Database
            targetLoan.money -= realPrincipalPaid;

            if (targetLoan.money <= 0) {
                // Nếu đã trả hết nợ gốc, xóa khoản vay khỏi mảng
                const updatedAllLoans = allLoans.filter(l => l !== targetLoan);
                await setKey(loanKey, updatedAllLoans);
            } else {
                // Nếu vẫn còn nợ gốc, cập nhật lại mảng dữ liệu
                await setKey(loanKey, allLoans);
            }

            // 10. Phản hồi kết quả
            return message.channel.send({
                content: `${verifyIcon} | **KẾT QUẢ THANH TOÁN**`,
                embeds: [{
                    color: 0x00FF00,
                    description: `Bạn đã trả cho <@${targetLoan.nguoi_cho_vay}> **${finalAmountToPay.toLocaleString()}** ${getIcon(currencyType)}.\n\n` +
                                 `> 📉 Lãi suất (${diffDays} ngày): **${(interestRate * 100).toFixed(0)}%**\n` +
                                 `> 💰 Tiền lãi đã trả: **${realInterestPaid.toLocaleString()}**\n` +
                                 `> 💸 Tiền gốc đã trừ: **${realPrincipalPaid.toLocaleString()}**\n` +
                                 `> 📝 Nợ gốc còn lại: **${Math.max(0, targetLoan.money).toLocaleString()}**`
                }]
            });

        } catch (error) {
            console.error("LỖI LỆNH TRANO:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi khi xử lý giao dịch trả nợ.`);
        }
    },
};