const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getIcon, addMoney, getBalance, removeMoney } = require("../utils/currency");
const { getKey, renderKey, setKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { errorIcon } = require('../utils/icon.js');
const {DEVELOPER_IDS} = require('../utils/constant.js');

module.exports = {
    name: 'hpbd',
    aliases: ['sinhnhat', 'birthday'],
    description: 'Chúc mừng sinh nhật',

    async execute(message, args) {
        // 1. Kiểm tra đối tượng được tag
        const target = message.mentions.users.first();
         const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || DEVELOPER_IDS.includes(message.author.id);
        if (!target) {
            return message.reply(`${errorIcon} | Vui lòng tag người bạn muốn chúc mừng sinh nhật!`);
        }

        if (target.id === message.author.id) {
            return message.reply('Bạn không thể tự tặng quà sinh nhật cho chính mình! 😊');
        }

        // Lấy số tiền từ tham số thứ 2 (ví dụ: .hpbd @user 1000)
        const amountArg = args[1];
        let giftMora = 0;
        
        // Kiểm tra nếu có nhập tiền và tiền phải là số dương
        if (isAdmin){
            giftMora = 100000;
        }
        if (amountArg && !isNaN(amountArg)) {
            giftMora = parseInt(amountArg);
        }
       

        const cakeId = 'banh_kem'; 
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
            let giftInfo = "";

            // 2. Xử lý giao dịch tiền (nếu có nhập tiền)
            if (giftMora > 0) {
                // Nếu KHÔNG PHẢI admin thì mới kiểm tra số dư và trừ tiền
                if (!isAdmin) {
                    const senderBalance = await getBalance(message.author.id);
                    if (senderBalance < giftMora) {
                        return message.reply(`${errorIcon} | Bạn không đủ **${giftMora.toLocaleString()}** ${getIcon()} để tặng quà!`);
                    }
                    await removeMoney(message.author.id, giftMora);
                }

                // Tặng tiền cho người nhận
                await addMoney(target.id, giftMora);
                giftInfo = `💰 **${giftMora.toLocaleString()}** ${getIcon()}`;
            }

            // 3. Nếu là Admin thì tặng thêm bánh vào balo người nhận
            if (isAdmin) {
                const invKey = renderKey("inventory", target.id);
                let inventory = (await getKey(invKey)) || [];
                inventory.push(cakeId);
                await setKey(invKey, inventory);
                
                const cakeText = `🎂 **1x ${cakeItem.name}** (Đã chuyển vào Balo)`;
                giftInfo = giftInfo ? `${giftInfo} và ${cakeText}` : cakeText;
            }

            // Nếu không có quà gì cả (Mem chúc không kèm tiền)
            if (!giftInfo) {
                giftInfo = "🎈 Một lời chúc chân thành nhất!";
            }

            // 4. Gửi Embed thông báo
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