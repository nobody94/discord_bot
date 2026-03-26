const { addMoney,removeMoney, getIcon, CURRENCIES } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'money',
    description: 'Quản lý tiền tệ người dùng (chỉ dành cho Developer).',  
    
    async execute(message, args) {
        // 1. Kiểm tra quyền hạn
        if (!DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply({ 
                content: `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`, 
                ephemeral: true 
            });
        }

        // 2. Kiểm tra tham số đầu vào
        // Cấu trúc: .money <add/remove/rm> <@user/ID> <số tiền> [loại tiền]
        const action = args[0]?.toLowerCase();
        let targetInput = args[1];
        const amount = parseInt(args[2]);
        const currencyType = args[3]?.toLowerCase() || 'mora';

        const usageHelp = `⚠️ Cách dùng:\n\`.money add <@user/ID> <số tiền> [loại tiền]\`\n\`.money remove <@user/ID> <số tiền> [loại tiền]\``;

        if (!['add', 'remove', 'rm'].includes(action) || !targetInput || isNaN(amount) || amount <= 0) {
            return message.reply(usageHelp);
        }

        // 3. Xử lý lấy ID từ @mention hoặc ID thuần
        let targetId = targetInput;
        if (targetId.startsWith('<@') && targetId.endsWith('>')) {
            targetId = targetId.slice(2, -1).replace(/[!&]/g, '');
        }

        if (!/^\d+$/.test(targetId)) {
            return message.reply(`${errorIcon} | Đối tượng "${targetInput}" không phải là ID hợp lệ.`);
        }

        // 4. Kiểm tra loại tiền hợp lệ
        if (!CURRENCIES[currencyType]) {
            return message.reply(`${errorIcon} | Loại tiền "${currencyType}" không hợp lệ. Hiện có: \`${Object.keys(CURRENCIES).join(", ")}\``);
        }
        
        const actionText = (action === 'add') ? "thêm" : "trừ";

        // 6. Thực hiện thay đổi số dư
        try {
            // Hàm addMoney thường xử lý được cả số âm để trừ tiền trong database
            const success = action === 'add' ? await addMoney(targetId, amount, currencyType) : removeMoney(targetId, amount, currencyType);

            if (success) {
                // Lấy thông tin User để hiển thị
                let targetUser;
                try {
                    targetUser = await message.client.users.fetch(targetId);
                } catch {
                    targetUser = { tag: `ID: ${targetId}` };
                }

                return message.channel.send({
                    content: `${verifyIcon} | Đã **${actionText}** thành công **${amount.toLocaleString()}** ${getIcon(currencyType)} cho **${targetUser.tag}**.`
                });
            } else {
                return message.reply(`${errorIcon} | Lỗi hệ thống khi cập nhật database.`);
            }
        } catch (error) {
            console.error("LỖI MONEY COMMAND:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi không xác định.`);
        }
    },
};