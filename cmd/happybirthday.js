const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getIcon, addMoney, getBalance, removeMoney } = require("../utils/currency");
const { getKey, renderKey, setKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
    name: 'hpbd',
    aliases: ['sinhnhat', 'birthday'],
    description: 'Chúc mừng sinh nhật (Chỉ hoạt động đúng ngày sinh nhật đã đăng ký)',

    async execute(message, args) {
        // 1. Kiểm tra đối tượng được tag
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply(`${errorIcon} | Vui lòng tag người bạn muốn chúc mừng sinh nhật!`);
        }

        // 2. LẤY NGÀY HIỆN TẠI (Định dạng DD/MM)
        const now = new Date();
        const currentDayMonth = `${now.getDate()}/${now.getMonth() + 1}`;

        // 3. LẤY NGÀY SINH NHẬT ĐÃ LƯU TRONG DB
        const birthKey = renderKey("user_birthday", target.id);
        const savedBirthday = await getKey(birthKey);

        if (!savedBirthday) {
            return message.reply(`${errorIcon} | **${target.username}** chưa thiết lập ngày sinh nhật trên hệ thống. (Admin hãy dùng \`.setbirthday\` trước)`);
        }

        // 4. KIỂM TRA XEM CÓ ĐÚNG NGÀY HÔM NAY KHÔNG
        if (savedBirthday !== currentDayMonth) {
            return message.reply(`${errorIcon} | Hôm nay (**${currentDayMonth}**) không phải là sinh nhật của **${target.username}** (**${savedBirthday}**). Không thể tặng quà!`);
        }

        // --- NẾU ĐÚNG NGÀY, TIẾP TỤC LOGIC TẶNG QUÀ ---

        const giftMora = 5000;    
        const cakeId = 'banh_sn'; 
        const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        const cakeItem = SHOP_ITEMS[cakeId] || { name: 'Bánh Kem', icon: '🎂' };

        // Mảng GIF ngẫu nhiên
        const birthdayGifs = [
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndnJueW5qZzR4ZWZ4eWp6ZzR4ZWZ4eWp6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/LROWHOfTm1Z1S/giphy.gif',
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2Z3R4eWp6ZzR4ZWZ4eWp6ZzR4ZWZ4eWp6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxP5OqYI2Y0/giphy.gif'
        ];
        const randomGif = birthdayGifs[Math.floor(Math.random() * birthdayGifs.length)];

        try {
            // Kiểm tra tiền người tặng
            const senderBalance = await getBalance(message.author.id);
            if (senderBalance < giftMora) {
                return message.reply(`${errorIcon} | Bạn không đủ **${giftMora.toLocaleString()}** ${getIcon()} để tặng quà!`);
            }

            // Trừ tiền người tặng, cộng tiền người nhận
            await removeMoney(message.author.id, giftMora);
            await addMoney(target.id, giftMora);

            let giftInfo = `💰 **${giftMora.toLocaleString()}** ${getIcon()}`;

            // Nếu là Admin thì tặng thêm bánh vào balo
            if (isAdmin) {
                const invKey = renderKey("inventory", target.id);
                let inventory = (await getKey(invKey)) || [];
                inventory.push(cakeId);
                await setKey(invKey, inventory);
                giftInfo += ` và 🎂 **1x ${cakeItem.name}** (Balo)`;
            }

            const embed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle('🎂 CHÚC MỪNG SINH NHẬT ĐÚNG NGÀY! 🎂')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setDescription(`Đúng hôm nay là sinh nhật của **${target.username}**! **${message.author.username}** đã gửi tặng một phần quà đặc biệt.`)
                .addFields({ name: '✨ Quà tặng:', value: giftInfo })
                .setImage(randomGif)
                .setFooter({ text: `Chúc mừng sinh nhật ${target.username}!` })
                .setTimestamp();

            await message.channel.send({ content: `<@${target.id}>`, embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply(`${errorIcon} | Lỗi hệ thống khi tặng quà.`);
        }
    }
};