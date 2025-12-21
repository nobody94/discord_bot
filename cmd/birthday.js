const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getIcon, addMoney, getBalance, removeMoney } = require("../utils/currency");
const { getKey, renderKey, setKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
    name: 'hpbd',
    aliases: ['sinhnhat', 'birthday'],
    description: 'Chúc mừng sinh nhật với GIF ngẫu nhiên',

    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) return message.reply(`${errorIcon} | Vui lòng tag người bạn muốn chúc mừng!`);
        if (target.id === message.author.id) return message.reply("Bạn không thể tự tặng quà cho chính mình!");

        // 1. Mảng chứa các link GIF sinh nhật ngẫu nhiên
        const birthdayGifs = [
            'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExem5lMzdkOGMwZW53MjVneG1zNzJ4Y2pka3czZXNndDM2ZHBzNG43NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Mjcv3Dg6irEG6Bb9In/giphy.gif',
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExem5lMzdkOGMwZW53MjVneG1zNzJ4Y2pka3czZXNndDM2ZHBzNG43NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VyB31XTqZNJhFRZNyl/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExem5lMzdkOGMwZW53MjVneG1zNzJ4Y2pka3czZXNndDM2ZHBzNG43NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WmJTjWGbhaSYfoEUaN/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExem5lMzdkOGMwZW53MjVneG1zNzJ4Y2pka3czZXNndDM2ZHBzNG43NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ljuSksqL9j0yI/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3djR6b3E2Y2llb3dyeDNmYjlmaXkyOW1tOTg3dmdzcmdmaDJqb3F2diZlcD12MV9naWZzX3NlYXJjaCZjdD1n/x8yTmOuGWbJa71sxL9/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MXU5dXV3YW02eTk5cWo5YjJqZTZ4a3VnNjVqN29mbDB6ZzE5c20zNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Y3THm9PonB55KXp9DI/giphy.gif"
        ];
        const randomGif = birthdayGifs[Math.floor(Math.random() * birthdayGifs.length)];

        // 2. Cấu hình quà tặng
        const giftMora = 5000;    
        const cakeId = 'banh_kem'; 
        const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        const cakeItem = SHOP_ITEMS[cakeId] || { name: 'Bánh Kem', icon: '🎂' };

        try {
            // 3. Kiểm tra tiền người tặng
            const senderBalance = await getBalance(message.author.id);
            if (senderBalance < giftMora) {
                return message.reply(`${errorIcon} | Bạn không đủ **${giftMora.toLocaleString()}** ${getIcon()} để tặng quà!`);
            }

            // 4. Trừ tiền người tặng, cộng tiền người nhận
            await removeMoney(message.author.id, giftMora);
            await addMoney(target.id, giftMora);

            // 5. Nếu là Admin thì tặng thêm bánh vào balo
            let giftInfo = `💰 **${giftMora.toLocaleString()}** ${getIcon()}`;
            if (isAdmin) {
                const invKey = renderKey("inventory", target.id);
                let inventory = (await getKey(invKey)) || [];
                inventory.push(cakeId);
                await setKey(invKey, inventory);
                giftInfo += ` và 🎂 **1x ${cakeItem.name}** (Balo)`;
            }

            // 6. Tạo Embed với GIF ngẫu nhiên
            const embed = new EmbedBuilder()
                .setColor(isAdmin ? '#FFB6C1' : '#FFD700')
                .setTitle(isAdmin ? '🎁 QUÀ SINH NHẬT ĐẶC BIỆT TỪ ADMIN 🎁' : '🎂 HAPPY BIRTHDAY 🎂')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setDescription(`**${message.author.username}** đã gửi một phần quà sinh nhật đến **${target.username}**!`)
                .addFields({ name: '✨ Quà tặng bao gồm:', value: giftInfo })
                .setImage(randomGif) // Sử dụng link GIF ngẫu nhiên ở đây
                .setFooter({ text: `Người chúc: ${message.author.username}` })
                .setTimestamp();

            await message.channel.send({ content: `<@${target.id}>`, embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply(`${errorIcon} | Đã xảy ra lỗi khi tặng quà.`);
        }
    }
};