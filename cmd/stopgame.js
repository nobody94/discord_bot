const { setWordleData,getWordleData } = require("../game/wordleHandler");

module.exports = {
  name: "stop",
  async execute(message, args) {
    // if (!message.member.permissions.has("MANAGE_CHANNELS")) return;

    const guildId = message.guild.id;
    const wordleData = await getWordleData(guildId);    
    
    //wordle game
    if (message.channel.id == wordleData.channelId) {
      if (!wordleData.status) return;
      
      await setWordleData(guildId,{
        status:false,
        answer:null,
        turn:0
      })    

      return message.reply("🛑 Đã dừng trò chơi đoán chữ. Dùng lệnh .start để bắt đầu game");
    }
  },
};
