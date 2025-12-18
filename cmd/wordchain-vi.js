const GameManager = require('../game/wordchain-vi');
const { setGameChannelId,getGameChannelId } = require('../game/game_settings');
const { PermissionFlagsBits } = require('discord.js');
const { checkHintLimit } = require('../utils/currency');


module.exports = {
    name: "setwordchain-vi",
    aliases: ["noichu-vi", 'ws', 'wc','stop-vi'],
    description: "Thiết lập kênh và bắt đầu trò chơi nối từ.",

    async execute(message, args, commandName) {       
         const guildId = message.guildId;
        const currentChannelId = message.channelId;  
        const selectedChannel = message.channel;
        const gameChannelId = getGameChannelId(guildId);  

        //hint
        const isHintShortcut = ["ws", "wc"].includes(commandName);
        if (isHintShortcut) {              
            if (currentChannelId !== gameChannelId) {
                return message.reply("❌ | Bạn chỉ có thể dùng lệnh gợi ý trong đúng kênh chơi game!");
            }

            if (!GameManager.isGameActive()) {
                return message.reply("❌ | Game chưa bắt đầu!");
            }

            const userId = message.author.id;
            const hintStatus = await checkHintLimit('wordchain_vi',userId);

            if (!hintStatus.canUse) {
                return message.reply("⚠️ | Bạn đã hết 5 lượt gợi ý miễn phí của ngày hôm nay rồi!");
            }

            const hint = GameManager.getHint();
            if (!hint) {
                return message.reply("😅 | Không tìm thấy từ nào hợp lệ để gợi ý!");
            }

            // Tăng số lượt đã dùng
            hintTracker[userId].count++;
            const remaining = 5 - hintTracker[userId].count;

            return message.reply({
                content: `💡 | Gợi ý: **||${hint.join(", ")}||**\n(Bạn còn **${remaining}/5** lượt dùng hôm nay)`,
                allowedMentions: { repliedUser: false }
            });
        }

        const isStop = ['stop-vi'].includes(commandName);
        
        if(isStop){
            if (currentChannelId !== gameChannelId) {
                return message.reply("❌ | Bạn chỉ có thể dùng lệnh trong đúng kênh chơi game!");
            }
             if (!GameManager.isGameActive()) {
                return message.reply("❌ | Game chưa bắt đầu!");
            }
            GameManager.stopGame();
        }

        // 1. Kiểm tra quyền hạn
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply("❌ Bạn cần quyền `Quản lý kênh` để thiết lập trò chơi.");
        }     

        // 2. Thiết lập kênh game (Lưu vào game_settings)
        setGameChannelId(guildId, selectedChannel.id);      

        // 3. Kiểm tra nếu game đang chạy thì reset/stop để bắt đầu ván mới hoàn toàn
        if (currentChannelId !== gameChannelId) {
                return 
        }
        if (GameManager.isGameActive()) {
            GameManager.stopGame();
        }

        // 4. Khởi tạo từ bắt đầu
        const startingWord = GameManager.getRandomWords();
        GameManager.startGame(startingWord);
        const nextRequiredWord = GameManager.getSecondPart(startingWord);

        await message.reply({
            content: `✅ Đã thiết lập **${selectedChannel}** làm kênh nối từ Tiếng Việt.\n` +
                `🎉 **Trò chơi bắt đầu ngay bây giờ!** 🎉\n` +
                `Từ bắt đầu: **${startingWord}**\n` +
                `Từ tiếp theo phải bắt đầu bằng **"${nextRequiredWord}"**.`,
            allowedMentions: { repliedUser: false }
        });
    },
};