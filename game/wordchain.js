const Money = require("../utils/currency");
const ViWordchain = require('./wordchain-vi');
const EnWordchain = require('./wordchain-en');

function WordChain(message,wordchain){
     if (gameChannelId && message.channelId !== gameChannelId) {
            return; // Bỏ qua nếu tin nhắn không ở đúng kênh game
          }
    
          if (wordchain.isRepeatPlayer(message.author.id)) {
            return message.reply({
              content:
                "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
              allowedMentions: { repliedUser: false },
            });
          }
    
          const result = wordchain.gameProcess(content);
    
          if (result.success) {
            const userId = message.author.id;
            const tienThuong = 100;
            wordchain.setLastUser(message.author.id);
    
            await Money.addMoney(userId, tienThuong);
    
            await message.channel.send(
              `✅ Từ hợp lệ ${message.author.username} được thưởng 100 ${Money.currencyIcon}\n` +
                `Từ tiếp theo phải bắt đầu bằng **"${result.nextRequiredWord}".`
            );
          } else {
            let replyMessage = result.message;
            if (result.reason == "OUT_OF_WORD") {
              const bonusReward = 500;
              await Money.addMoney(userId, bonusReward);
              await message.reply({
                content: `${replyMessage}\n ${message.author.username} được thưởng 500 ${Money.currencyIcon}`,
                allowedMentions: { repliedUser: false },
              });
              wordchain.stopGame();
              setTimeout(() => {
                const newStart = wordchain.getRandomWords();
                wordchain.startGame(newStart);
                message.channel.send(
                  `🔄 **Ván mới bắt đầu!** Từ bắt đầu: **${newStart}**`
                );
              }, 3000);
            } else {
              await message.reply({
                content: replyMessage,
                allowedMentions: { repliedUser: false },
              });
            }
          }
}

module.exports={
    WordChain
}