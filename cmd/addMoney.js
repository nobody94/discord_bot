const { addMoney, getIcon, CURRENCIES } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');

// 1. Cấu hình ID của bạn (Developer) để có quyền tối cao
const DEVELOPER_IDS = ['1446889473374683400']; 

module.exports = {
    name: 'addmoney',
    description: 'Thêm tiền cho người dùng bằng @mention hoặc ID (chỉ dành cho Developer).',  
    
    async execute(message, args) {
        // 2. Kiểm tra quyền hạn (Phải có trong ID trong danh sách Developer)
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);

        if (!isDeveloper ) {
            return message.reply({ 
                content: `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`, 
                ephemeral: true 
            });
        }

        // 3. Kiểm tra tham số đầu vào
        if (args.length < 2) {
            return message.reply(`Sử dụng: \`.addmoney <@user hoặc UserID> <SốTiền> [loại tiền]\` \nVí dụ: \`.addmoney @Nobody 1000 primo\``);
        }

        // 4. Xử lý lấy ID từ @mention hoặc ID thuần
        let targetId = args[0];
        if (targetId.startsWith('<@') && targetId.endsWith('>')) {
            targetId = targetId.slice(2, -1);
            if (targetId.startsWith('!')) targetId = targetId.slice(1);
            if (targetId.startsWith('&')) targetId = targetId.slice(1); // Hỗ trợ mention role nếu cần
        }

        const amount = parseInt(args[1]);
        // Lấy loại tiền từ tham số thứ 3, nếu không nhập mặc định là 'mora'
        const currencyType = args[2]?.toLowerCase() || 'mora';

        // 5. Kiểm tra tính hợp lệ của dữ liệu
        if (!/^\d+$/.test(targetId)) {
            return message.reply(`${errorIcon} | Đối tượng "${args[0]}" không hợp lệ. Vui lòng @mention hoặc nhập ID chính xác.`);
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply(`${errorIcon} | Số tiền "${args[1]}" không hợp lệ.`);
        }

        // Kiểm tra xem loại tiền có tồn tại trong currency.js không
        if (!CURRENCIES[currencyType]) {
            return message.reply(`${errorIcon} | Loại tiền "${currencyType}" không tồn tại. Các loại hiện có: \`${Object.keys(CURRENCIES).join(", ")}\``);
        }

        // 6. Thực hiện cộng tiền
        let targetUser;
        try {
            targetUser = await message.client.users.fetch(targetId);
        } catch (error) {
            targetUser = { tag: `ID:${targetId}` }; 
        }

        try {
            const success = await addMoney(targetId, amount, currencyType);

            if (success) {
                return message.channel.send({
                    content: `${verifyIcon} | Đã thêm thành công **${amount.toLocaleString()}** ${getIcon(currencyType)} vào tài khoản của **${targetUser.tag}**.`,
                });
            } else {
                return message.reply(`${errorIcon} | Lỗi hệ thống khi cập nhật số dư vào database.`);
            }
        } catch (error) {
            console.error("LỖI ADDMONEYTO:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi không xác định.`);
        }
    },
};