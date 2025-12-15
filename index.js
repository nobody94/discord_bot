require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const Token = process.env.BOT_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let gameActive = false;
let currentLastWord = null;
const wordHistory = new Set();
const prefix = '!';

const listWord = new Set(
  fs
    .readFileSync("Viet74K.txt", "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const dictionary = Array.from(listWord).filter(
  (phrase) => phrase.split(" ").length === 2
);

//lấy 2 từ ngẫu nhiên
function getRandomWords() {
  const words = Array.from(dictionary);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
}

function isValidWord(word) {
  return dictionary.includes(word.toLowerCase());
  // console.log(word);

  // return true
}

client.on("ready", () => {
  console.log(`✅ Bot ${client.user.tag} đã sẵn sàng!`);
});

client.on("messageCreate", async (message) => {
  // Bỏ qua tin nhắn của bot
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();
  const parts = content.split(/\s+/);
  const command = parts[0];
  const [firstWord, secondWord] = parts;
  const isCommand = command.startsWith(prefix);

  if (command == "!startgame") {    
    if (gameActive) {
      return message.reply(
        `Trò chơi đang diễn ra. Từ nối tiếp cần bắt đầu: **${currentLastWord}**.`
      );
    }

    gameActive = true;    
    wordHistory.clear();

    //Từ ngẫu nhiên khi bắt đầu game
    const firstPhrase = getRandomWords();    
    const [firstWordPhase, secondWordPhase] = firstPhrase.split(' ');
    currentLastWord = secondWordPhase;
    wordHistory.add(firstPhrase);    
    await message.reply(
      `🎮 **Bắt đầu trò chơi nối từ tiếng Việt!**\nTừ bắt đầu:${firstPhrase}`
    );
  }
  
  if (command == "!stopgame") {
    if (!gameActive) {
      return message.reply("Hiện không có trò chơi nào đang diễn ra.");
    }

    gameActive = false;
    const totalWords = wordHistory.size;
    currentLastWord = null;
    wordHistory.clear();
    return message.channel.send(
      `Trò chơi nối từ đã kết thúc! Tổng cộng **${totalWords}** từ đã được sử dụng.`
    );
  }

  if (!isCommand && gameActive) {
    // Phải có 2 từ
    if (parts.length !== 2) {
      message.reply("❌ Bạn phải nhập cụm 2 từ");
      return;
    }
    // Lấy tất cả cụm 2 từ chưa dùng và bắt đầu bằng secondWord
    
    const nextOptions =  dictionary.filter((p) => {
      if (wordHistory.has(p)) return false;
      return secondWord ?  p.split(" ")[0] === secondWord : p.split(" ")[0] === currentLastWord;
    });   

    //hết từ nối
    if (nextOptions.length === 0) {
      gameActive = false;
      currentLastWord = null;
      wordHistory.clear();
      message.reply(`⚠️ Không còn từ nối tiếp hợp lệ! Game kết thúc.`);
      return;
    }

    // Kiểm tra hợp lệ theo từ điển
    if (!isValidWord(content)) {
      message.reply("❌ Từ này không có trong từ điển!");
      return;
    }
    // Không lặp cụm
    if (wordHistory.has(content)) {
      message.reply("❌ Cụm này đã dùng rồi, hãy nhập cụm khác!");
      return;
    }
    // Nếu là cụm đầu tiên
    if (!currentLastWord) {
      currentLastWord = secondWord;
      wordHistory.add(content);
      message.reply(
        `✔ Bắt đầu với **${content}**\nCụm tiếp theo phải bắt đầu bằng **"${secondWord}"**`
      );
      return;
    }
    // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
    if (firstWord !== currentLastWord) {
      message.reply(
        `❌ Sai rồi! Cụm từ phải bắt đầu bằng **"${currentLastWord}"**.`
      );
      return;
    }

    // Hợp lệ → cập nhật
    wordHistory.add(content);
    currentLastWord = secondWord;

    message.reply(`✔ Hợp lệ! Từ kế tiếp phải bắt đầu bằng **"${secondWord}"**`);
  }
});

client.login(Token);