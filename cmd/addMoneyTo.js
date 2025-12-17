const { PermissionsBitField } = require('discord.js');

const { addMoney, currencyIcon } = require('../utils/currency.js'); 

module.exports = {
    name: 'addmoneyto',
    description: 'Thêm tiền vào tài khoản của một người dùng khác server (Chỉ dành cho Admin).',   
    userPermissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        // 1. KIỂM TRA QUYỀN HẠN CỦA NGƯỜI DÙNG CHẠY LỆNH
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ 
                content: "❌ | Bạn không có quyền **Quản trị viên** để sử dụng lệnh này.", 
                ephemeral: true 
            });
        }

        // 2. PHÂN TÍCH THAM SỐ
        if (args.length !== 2) {
            return message.reply(`Sử dụng: \`.addmoneyto <UserID> <SốTiền>\``);
        }

        const targetId = args[0]; 
        const amount = parseInt(args[1]);

        if (!/^\d+$/.test(targetId)) {
            return message.reply(`❌ | UserID "${targetId}" không hợp lệ. Vui lòng cung cấp một dãy số ID chính xác.`);
        }

        if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
            return message.reply(`❌ | Số tiền "${args[1]}" không hợp lệ. Phải là số nguyên dương.`);
        }

        // --- ĐOẠN CODE ĐƯỢC SỬA ĐỂ BẢO VỆ KHỎI LỖI KHÔNG XÁC ĐỊNH ---

        let targetUser;
        try {
            // Cố gắng tìm thông tin User trên Discord
            targetUser = await message.client.users.fetch(targetId);
        } catch (error) {
            // LỖI Ở ĐÂY LÀ PHỔ BIẾN NHẤT
            console.warn(`[LỖI FETCH USER] Không thể fetch thông tin người dùng ID ${targetId}. Tiếp tục thêm tiền...`, error);
            // Tạo đối tượng tạm thời nếu không tìm thấy (để hiển thị trong tin nhắn cuối)
            targetUser = { 
                tag: `ID:${targetId}`,
                username: `ID:${targetId}`
            }; 
        }

        try {
            // Gọi hàm addMoney (từ file taixiu.js)
            const success = await addMoney(targetId, amount);

            if (success) {
                return message.channel.send({
                    content: `✅ | Đã thêm thành công **${amount}** ${currencyIcon} vào tài khoản của **${targetUser.tag}**.`,
                });
            } else {
                // Nếu hàm addMoney trả về false (do lỗi DB được xử lý)
                return message.reply("❌ | Lỗi hệ thống khi thêm tiền. Vui lòng kiểm tra console hoặc database.");
            }
        } catch (error) {
            // Lỗi ở đây là lỗi không xác định thực sự (ReferenceError,...)
            console.error("LỖI KHÔNG XÁC ĐỊNH KHI XỬ LÝ LỆNH ADDMONEY:", error);
            return message.reply("❌ | Đã xảy ra lỗi không xác định khi xử lý lệnh.");
        }
    },
};