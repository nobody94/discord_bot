const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const invisibleChar = '\u200B';

module.exports = {
    name: 'help',
    aliases: ['h', 'trogiup'],
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
                    value: '• balance, money, tien, cash: Kiểm tra số tiền hiện có\n• daily, claim, dl: Nhận thưởng daily',
                    inline:false   
                },
                { 
                    name: '❤️ Tương tác',
                    value: '• kiss: Hôn\n• hug: ôm\n• airkiss: hôn gió\n• cuddle: ôm ấp\n• lick: liếm\n• pat: vỗ\n• highfive: đập tay',
                    inline:true                      
                },               
                 { 
                    name: invisibleChar, 
                    value: '• slap: tát\n• poke: chọc\n• bite: cắn\n• punch: đấm\n• bonk: gõ đầu\n• kick: đá\n• stare: nhìn phán xét',
                    inline:true 
                },
                { 
                    name: '⚙️ Cấu hình (Admin)', 
                    value: '• setwordchain-vi: Thiết lập kênh nối chữ Tiếng Việt\nws, wc: Gợi ý từ nối từ Tiếng Việt\n• setwordchain-en: Thiết lập kênh nối chữ Tiếng Anh\nhint, ht: Gợi ý từ nối từ Tiếng Anh\nGợi ý từ nối từ chỉ dùng trong kênh nối từ tối đa 5 lượt/ngày' 
                }
            )
            .setFooter({ text: 'Sử dụng dấu chấm (.) trước mỗi lệnh.' })
            .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
    },
};