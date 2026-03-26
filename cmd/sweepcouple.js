const { renderKey, getKey, setKey } = require('../utils/db');
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');
const { SHOP_ITEMS } = require("../utils/shop.js");

module.exports = {
    name: "sweepcouple",
    aliases: ["swcp", "sweep"],
    description: "Càn quét tất cả cặp đôi: trừ tiền và tặng Nhẫn Cưới cho CHỒNG.",
    
    async execute(message, args) {
        // 1. Kiểm tra quyền Developer
        if (!DEVELOPER_IDS.includes(message.author.id)) {
            return message.reply(`${errorIcon} | Bạn không có quyền sử dụng lệnh hệ thống này.`);
        }

        const guildId = message.guild.id;
        const coupleKey = renderKey('couple', guildId);
        const couplesList = (await getKey(coupleKey)) || [];

        if (couplesList.length === 0) {
            return message.reply("❌ Không tìm thấy dữ liệu cặp đôi nào trong máy chủ này.");
        }


        let processedCount = 0;
        const statusMsg = await message.channel.send("🔄 Đang thực hiện càn quét");

        // 3. Vòng lặp xử lý - CHỈ XỬ LÝ HUSBAND
        for (const couple of couplesList) {
            const husbandId = couple.husband; // Chỉ lấy ID người chồng

            try {
                // Thêm Nhẫn vào túi đồ (inventory) của người chồng
                const bagKey = renderKey('inventory', husbandId);
                let userBag = (await getKey(bagKey)) || [];
                
                const updateBag = userBag.filter((i)=> typeof i == 'string');
                
                await setKey(bagKey, updateBag);
                processedCount++;
            } catch (err) {
                console.error(`Lỗi xử lý ${husbandId}:`, err);
            }
        }

        // 4. Hoàn tất
        return statusMsg.edit({
            content: `${verifyIcon} | **Hoàn tất càn quét!**\n- Đã xử lý: **${processedCount}** người.\n- xóa vật phẩm lạ.`
        });
    }
};