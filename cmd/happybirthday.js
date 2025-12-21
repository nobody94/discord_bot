const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getIcon, addMoney, getBalance, removeMoney } = require("../utils/currency");
const { getKey, renderKey, setKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
    name: 'hpbd',
    aliases: ['sinhnhat', 'birthday'],
    description: 'Chúc mừng sinh nhật (Admin tặng Bánh + Mora, Mem tặng Mora)',

    async execute(message, args) {
        // 1. Kiểm tra đối tượng được tag
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply(`${errorIcon} | Vui lòng tag người bạn muốn chúc mừng sinh nhật!`);
        }

        if (target.id === message.author.id) {
            return message.reply('Bạn không thể tự tặng quà sinh nhật cho chính mình! 😊');
        }

        // --- ĐÃ LOẠI BỎ LOGIC KIỂM TRA ĐÚNG NGÀY HỆ THỐNG ---

        const giftMora = 5000;    
        const cakeId = 'banh_sn'; 
        const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        const cakeItem = SHOP_ITEMS[cakeId] || { name: 'Bánh Kem', icon: '🎂' };

        // Mảng GIF ngẫu nhiên
        const birthdayGifs = [
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTg1anBmaDh4bzhxeW1ob25qdWsxb21kYzQ1djB5OXBwazJuazl3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Mjcv3Dg6irEG6Bb9In/giphy.gif',
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTg1anBmaDh4bzhxeW1ob25qdWsxb21kYzQ1djB5OXBwazJuazl3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VyB31XTqZNJhFRZNyl/giphy.gif',
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTg1anBmaDh4bzhxeW1ob25qdWsxb21kYzQ1djB5OXBwazJuazl3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ljuSksqL9j0yI/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTg1anBmaDh4bzhxeW1ob25qdWsxb21kYzQ1djB5OXBwazJuazl3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WmJTjWGbhaSYfoEUaN/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTg1anBmaDh4bzhxeW1ob25qdWsxb21kYzQ1djB5OXBwazJuazl3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kPIrzoMdhZJisCre2S/giphy.gif"
        ];
        const randomGif = birthdayGifs[Math.floor(Math.random() * birthdayGifs.length)];

        try {
            // 2. Kiểm tra số dư người tặng (Để tránh spam tiền ảo)
            const senderBalance = await getBalance(message.author.id);
            if (senderBalance < giftMora) {
                return message.reply(`${errorIcon} | Bạn không đủ **${giftMora.toLocaleString()}** ${getIcon()} để tặng quà!`);
            }

            // 3. Thực hiện giao dịch tiền
            await removeMoney(message.author.id, giftMora);
            await addMoney(target.id, giftMora);

            let giftInfo = `💰 **${giftMora.toLocaleString()}** ${getIcon()}`;

            // 4. Nếu là Admin thì tặng thêm bánh vào balo người nhận
            if (isAdmin) {
                const invKey = renderKey("inventory", target.id);
                let inventory = (await getKey(invKey)) || [];
                inventory.push(cakeId);
                await setKey(invKey, inventory);
                giftInfo += ` và 🎂 **1x ${cakeItem.name}** (Đã chuyển vào Balo)`;
            }

            // 5. Gửi Embed thông báo
            const embed = new EmbedBuilder()
                .setColor(isAdmin ? '#FFB6C1' : '#3498db')
                .setTitle('🎂 CHÚC MỪNG SINH NHẬT! 🎂')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setDescription(`**${message.author.username}** đã gửi tặng một phần quà sinh nhật đến **${target.username}**!`)
                .addFields({ name: '✨ Chi tiết quà tặng:', value: giftInfo })
                .setImage(randomGif)
                .setFooter({ text: `Người chúc: ${message.author.username}` })
                .setTimestamp();

            await message.channel.send({ content: `<@${target.id}>`, embeds: [embed] });

        } catch (error) {
            console.error('Lỗi lệnh HPBD:', error);
            message.reply(`${errorIcon} | Có lỗi xảy ra trong quá trình tặng quà.`);
        }
    }
};