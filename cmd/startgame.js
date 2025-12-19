const { setWordleData,getWordleData } = require("../game/wordleHandler");
const { getRandomWord,shuffleWord } = require('../game/wordleHandler');

module.exports = {
  name: "start",
  async execute(message, args) {
    //game đoán chữ
    const guildId = message.guild.id;

    const wordleData = await getWordleData(guildId);

    const wordleChannelId = wordleData.channelId;

    if (!wordleChannelId) return message.reply("❌ Hãy set channel trước!");
    //wordle game    
    if (message.channel.id === wordleChannelId) {
      if (wordleData.status){
        return message.channel.send('Trò chơi đã bắt đầu, nếu không thấy game đang chạy hãy dùng lệnh .stop để ngừng game')
      }

      const firstAnswer = getRandomWord(); 
      const shuffled = shuffleWord(firstAnswer);     

      await setWordleData(guildId,{
        status:true,
        answer:firstAnswer,
        turn:1
      })     

      return message.channel.send(
        `✅ **Trò chơi đoán chữ bắt đầu!** (Giới hạn: 5 lượt)\n\n📝 **Lượt 1/5:** Hãy sắp xếp các chữ: **${shuffled}**`
      );
    }

    return;
  },
};
