const { addMoney, getIcon } = require('../utils/currency.js');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'reward',
    description: 'Trao thưởng hàng tuần cho Top Voice hoặc Top Chat.',

    async execute(message, args) {
        // 1. Kiểm tra quyền hạn
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
        if (!isDeveloper) {
            return message.reply(`${errorIcon} | Bạn không có quyền sử dụng lệnh này.`);
        }

        // 2. Kiểm tra tham số (Loại thưởng + 3 người dùng)
        if (args.length < 4) {
            return message.reply(`Cách dùng: \`.reward <voice|chat> @Top1 @Top2 @Top3\` \nVí dụ: \`.reward voice @User1 @User2 @User3\``);
        }

        // 3. Xác định loại hình thưởng
        const type = args[0].toLowerCase();
        let typeName = "";

        if (type === 'voice') {
            typeName = "TOP VOICE HÀNG TUẦN 🎙️";
        } else if (type === 'chat') {
            typeName = "TOP CHAT HÀNG TUẦN 💬";
        } else {
            return message.reply(`${errorIcon} | Loại thưởng không hợp lệ! Hãy chọn \`voice\` hoặc \`chat\`.`);
        }

        // 4. Cấu hình mức thưởng (Bạn có thể tùy chỉnh lại nếu muốn)
        const rewards = [
            { rank: "Hạng Nhất", mora: 100000, primo: 20 },
            { rank: "Hạng Nhì", mora: 75000, primo: 15 },
            { rank: "Hạng Ba", mora: 50000, primo: 10 }
        ];

        let resultMessage = `## 🏆 KẾT QUẢ ${typeName} 🏆\n\n`;

        // 5. Lặp qua các User (bắt đầu từ args[1] vì args[0] là loại thưởng)
        for (let i = 0; i < 3; i++) {
            let targetId = args[i + 1]; // Lấy từ vị trí thứ 2 trở đi

            if (!targetId) continue;

            // Xử lý lấy ID từ mention
            if (targetId.startsWith('<@') && targetId.endsWith('>')) {
                targetId = targetId.slice(2, -1).replace(/[!&]/g, '');
            }

            if (!/^\d+$/.test(targetId)) {
                resultMessage += `❌ **${rewards[i].rank}**: ID không hợp lệ.\n`;
                continue;
            }

            try {
                // Thực hiện cộng tiền
                await addMoney(targetId, rewards[i].mora, 'mora');
                await addMoney(targetId, rewards[i].primo, 'primo');

                resultMessage += `${verifyIcon} **${rewards[i].rank}**: <@${targetId}> nhận **${rewards[i].mora.toLocaleString()}** ${getIcon('mora')} và **${rewards[i].primo.toLocaleString()}** ${getIcon('primo')}\n`;
            } catch (error) {
                console.error(`Lỗi thưởng:`, error);
                resultMessage += `❌ **${rewards[i].rank}**: Lỗi khi trao thưởng cho <@${targetId}>.\n`;
            }
        }

        // 6. Gửi kết quả
        return message.channel.send(resultMessage);
    },
};