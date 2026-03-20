const { addMoney, getIcon } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'salary',
    description: 'Phát lương tuần cố định cho danh sách nhân sự.',

    async execute(message) {
        // 1. Kiểm tra quyền hạn
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
        if (!isDeveloper) {
            return message.reply(`${errorIcon} | Bạn không có quyền phát lương.`);
        }

        // 2. DANH SÁCH NHÂN SỰ CỐ ĐỊNH (Thay ID vào đây)
        const staffs = [
            { id: '1308643245018054716', primo: 60 }, 
            { id: '1302095613609115689', primo: 50 },
            { id: '1016709206780411924', primo: 50 },
            { id: '1446889473374683400', primo: 50 }
        ];

        let resultMessage = `## 💸 BẢNG LƯƠNG TUẦN CỐ ĐỊNH 💸\n\n`;

        // 3. Thực hiện phát lương tự động
        for (const staff of staffs) {
            try {
                // Kiểm tra nếu ID trống hoặc không phải số
                if (!staff.id || !/^\d+$/.test(staff.id)) {
                    resultMessage += `❌ **QTV**: ID chưa được thiết lập chính xác.\n`;
                    continue;
                }

                // Cộng tiền Primo
                await addMoney(staff.id, staff.primo, 'primo');

                resultMessage += `**QTV**: <@${staff.id}> đã nhận **${staff.primo}** ${getIcon('primo')}\n`;
            } catch (error) {
                console.error(`Lỗi phát lương cho ${staff.id}:`, error);
                resultMessage += `❌ **QTV**: Lỗi hệ thống khi phát cho <@${staff.id}>.\n`;
            }
        }

        // 4. Gửi thông báo hoàn tất
        return message.channel.send(resultMessage);
    },
};