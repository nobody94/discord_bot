const { nextQuestion, getWordleData, setWordleData } = require("../game/wordleHandler");

module.exports = {
  name: "start",
  async execute(message) {
    const wordleData = await getWordleData(message.guild.id);
    if (message.channel.id !== wordleData.channelId) return;
    if (wordleData.status) return message.reply("Game đang chạy rồi!");

    await setWordleData(message.guild.id, { turn: 0, status: true });
    return nextQuestion(message, message.guild.id);
  },
};