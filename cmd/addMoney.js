const { addMoney, getIcon, CURRENCIES } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'addmoney',
    aliases: ['amoney'], // Thêm alias cho tiện sử dụng
    description: 'Thêm tiền cho người dùng bằng @mention hoặc ID (chỉ dành cho Developer).',  
    
    async execute(message, args) {
        // 1. Kiểm tra quyền hạn
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
        if (!isDeveloper) {
            return message.reply({ 
                content: `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`, 
                ephemeral: true 
            });
        }

        // 2. Kiểm tra tham số đầu vào (Cần ít nhất: ID và Số tiền)
        if (args.length < 2) {
            return message.reply(`Cách dùng: \`.addmoney <@user hoặc UserID> <Số tiền> [loại tiền]\` \nVí dụ: \`.addmoney @User 1000 primo\``);
        }

        // 3. Xử lý lấy ID từ @mention hoặc ID thuần
        let targetId = args[0];
        if (targetId.startsWith('<@') && targetId.endsWith('>')) {
            targetId = targetId.slice(2, -1).replace(/[!&]/g, '');
        }

        const amount = parseInt(args[1]);
        // Mặc định là 'mora' nếu không nhập loại tiền
        const currencyType = args[2]?.toLowerCase() || 'mora';

        // 4. Kiểm tra tính hợp lệ của dữ liệu
        if (!/^\d+$/.test(targetId)) {
            return message.reply(`${errorIcon} | Đối tượng "${args[0]}" không hợp lệ.`);
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply(`${errorIcon} | Số tiền "${args[1]}" không hợp lệ.`);
        }

        // Kiểm tra loại tiền có tồn tại không
        if (!CURRENCIES[currencyType]) {
            return message.reply(`${errorIcon} | Loại tiền "${currencyType}" không hợp lệ. Các loại hiện có: \`${Object.keys(CURRENCIES).join(", ")}\``);
        }

        // 5. Lấy thông tin User để hiển thị (Nếu không tìm thấy thì hiện ID)
        let targetUser;
        try {
            targetUser = await message.client.users.fetch(targetId);
        } catch (error) {
            targetUser = { tag: `ID: ${targetId}` };
        }

        // 6. Thực hiện cộng tiền
        try {
            const success = await addMoney(targetId, amount, currencyType);

            if (success) {
                return message.channel.send({
                    content: `${verifyIcon} | Đã thêm thành công **${amount.toLocaleString()}** ${getIcon(currencyType)} cho **${targetUser.tag}**.`
                });
            } else {
                return message.reply(`${errorIcon} | Lỗi hệ thống khi cộng tiền vào database.`);
            }
        } catch (error) {
            console.error("LỖI ADDMONEY:", error);
            return message.reply(`${errorIcon} | Đã xảy ra lỗi không xác định.`);
        }
    },
};