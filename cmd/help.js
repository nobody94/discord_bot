const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const invisibleChar = '\u200B';

module.exports = {
    name: 'help',
    aliases: ['trogiup'],
    description: 'Danh sách các lệnh của Bot',

    async execute(message, args) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 Danh Sách Lệnh')
            .setDescription('Dưới đây là các lệnh bạn có thể sử dụng:')
            .addFields(
                { 
                    name: '🎮 Trò chơi (Games)', 
                    value: '• slots, slot, sl: Chơi máy đánh bạc\n• taixiu, tx: Chơi tài xỉu',
                    inline:false  
                },                
                { 
                    name: '💵 Tiền tệ', 
                    value: '• balance, money, tien, cash: Kiểm tra số tiền hiện có\n• daily, claim: Nhận thưởng daily',
                    inline:true   
                },
                { 
                    name: invisibleChar, 
                    value: '• shop: Xem shop\n• balo:Xem balo\n• buy: Mua đồ',
                    inline:true   
                },
                { 
                    name: '❤️ Tương tác',
                    value: '• kiss: Hôn\n• hug: ôm\n• airkiss: hôn gió\n• cuddle: ôm ấp\n• lick: liếm\n• pat: vỗ\n• highfive: đập tay',
                    inline:true                      
                },               
                 { 
                    name: invisibleChar, 
                    value: '• slap: tát\n• poke: chọc\n• bite: cắn\n• punch: đấm\n• bonk: gõ đầu\n• kick: đá\n• stare: nhìn phán xét\n• laugh: cười',
                    inline:true 
                },
                { 
                    name: '⚙️ Cấu hình (Admin)', 
                    value: '• setwordchain-vi: Thiết lập kênh nối chữ Tiếng Việt\n• setwordchain-en: Thiết lập kênh nối chữ Tiếng Anh\n• setwordle: Thiết lập kênh vua tiếng việt\nhint, wc, ws: Dùng để search từ trong kênh nối từ Tiếng Việt/Tiếng Anh(Mỗi ngày được 5 lượt)' 
                }
            )
            .setFooter({ text: 'Sử dụng dấu chấm (.) trước mỗi lệnh.' })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    },
};