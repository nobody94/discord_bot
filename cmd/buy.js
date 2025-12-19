const { getBalance, removeMoney, getIcon } = require('../utils/currency');
const { renderKey,pushKey } = require('../utils/db');
const {SHOP_ITEMS} = require('../utils/shop');
const { errorIcon, verifyIcon } = require('../utils/icon.js')

module.exports = {
    name: 'buy',
    description: 'Mua vật phẩm từ cửa hàng.',
    aliases: ['mua'],

    async execute(message, args) {
        const userId = message.author.id;
        const itemId = args[0]?.toLowerCase();

        // 1. Kiểm tra xem người dùng có nhập ID vật phẩm không
        if (!itemId) {
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn mua. Ví dụ: .buy the_doi_ten`);
        }

        // 2. Kiểm tra vật phẩm có tồn tại trong SHOP_ITEMS không
        const item = SHOP_ITEMS[itemId];
        if (!item) {
            return message.reply(`${errorIcon} | Vật phẩm với ID \`${itemId}\` không tồn tại trong cửa hàng. Dùng \`.shop\` để xem danh sách.`);
        }

        // 3. Kiểm tra số dư người dùng
        const userBalance = await getBalance(userId, item.currency);
        if (userBalance < item.price) {
            return message.reply(`💸 | Bạn không đủ **${item.price.toLocaleString()}** ${getIcon(item.currency)} để mua ${item.icon} **${item.name}**.`);
        }

        try {
            // 4. Thực hiện trừ tiền
            const success = await removeMoney(userId, item.price, item.currency);
            
            if (success) {
                // 5. Thêm vật phẩm vào túi đồ (inventory) trong DB
                // Chúng ta lưu mảng các ID vật phẩm đã mua
                const invKey = renderKey('inventory',userId);
                await pushKey(invKey,itemId);                 

                return message.reply({
                    content: `${verifyIcon} | Chúc mừng! Bạn đã mua thành công ${item.icon} **${item.name}** với giá **${item.price.toLocaleString()}** ${getIcon(item.currency)}.\n📦 Gõ \`.balo\` để kiểm tra túi đồ.`
                });
            } else {
                return message.reply(`${errorIcon} | Đã xảy ra lỗi trong quá trình xử lý giao dịch.`);
            }
        } catch (error) {
            console.error("LỖI KHI MUA ĐỒ:", error);
            return message.reply(`${errorIcon} | Hệ thống gặp lỗi không xác định khi mua vật phẩm.`);
        }
    }
};