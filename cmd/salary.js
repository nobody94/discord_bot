const { addMoney, getIcon } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'salary',
    description: 'Phát lương tuần cố định cho danh sách nhân sự.',

    async execute(message,args) {
        // 1. Kiểm tra quyền hạn
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
        if (!isDeveloper) {
            return message.reply(`${errorIcon} | Bạn không có quyền phát lương.`);
        }

        // Kiểm tra xem có tham số đầu vào không
        if (!args || args.length === 0) {
            return message.reply(`❌ Sai cú pháp! Sử dụng: \`.salary qtv\` hoặc \`.salary @role [số tiền] mora/primo\``);
        }
        const subCommand = args[0].toLowerCase();
        let listToPay = [];

        // 2. XỬ LÝ LOGIC CHỌN ĐỐI TƯỢNG VÀ LOẠI TIỀN
        if (subCommand === 'qtv') {
            // Danh sách cố định (mặc định là primo)
            listToPay = [
                { id: '1308643245018054716', amount: 60, type: 'primo' },
                { id: '1302095613609115689', amount: 50, type: 'primo' },
                { id: '1016709206780411924', amount: 50, type: 'primo' },
                { id: '1446889473374683400', amount: 50, type: 'primo' }
            ];
        } else {
            // Xử lý theo Role: .salary @role 100 primo
            const role = message.mentions.roles.first();
            const amount = parseInt(args[1]);
            const currencyType = args[2] ? args[2].toLowerCase() : 'mora'; 

            if (!role) {
                return message.reply(`❌ Bạn cần tag một Role hoặc dùng từ khóa \`qtv\`.`);
            }
            if (isNaN(amount) || amount <= 0) {
                return message.reply(`❌ Bạn chưa nhập số tiền hợp lệ.`);
            }

            // Lấy thành viên trong Role
            const members = role.members;
            if (members.size === 0) {
                return message.reply(`❌ Role này hiện không có thành viên nào.`);
            }

            listToPay = members.map(m => ({ id: m.id, amount: amount, type: currencyType }));
        }

        // 3. THỰC HIỆN PHÁT LƯƠNG
        let resultMessage = `## 💸 BẢNG LƯƠNG HỆ THỐNG 💸\n\n`;
        const statusMsg = await message.channel.send("🔄 Đang xử lý giao dịch...");

        for (const item of listToPay) {
            try {
                // Sử dụng addMoney với loại tiền động
                await addMoney(item.id, item.amount, item.type);
                resultMessage += `<@${item.id}>: **+${item.amount}** ${getIcon(item.type)}\n`;
            } catch (error) {
                console.error(`Lỗi phát lương cho ${item.id}:`, error);
                resultMessage += `❌ Lỗi khi phát cho <@${item.id}>.\n`;
            }
        }

        // 4. CẬP NHẬT KẾT QUẢ CUỐI CÙNG
        return statusMsg.edit(resultMessage);
    },
};