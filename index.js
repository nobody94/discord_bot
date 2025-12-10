const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  Collection,
} = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Biến lưu trạng thái game
let gameOn = false;
let lastSecondWord = null;
let usedPhrases = new Set();
// BẢNG ĐIỂM
let scores = new Map();
// TỪ ĐIỂN TIẾNG VIỆT
const dictionary = new Set(
  fs
    .readFileSync("Viet74K.txt", "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);
const twoWordDic = Array.from(dictionary).filter(
  (phrase) => phrase.split(" ").length === 2
);

function isValidVietnameseWord(word) {
  return dictionary.has(word.toLowerCase());
}

// Đăng ký slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("startword")
    .setDescription("Bắt đầu trò chơi nối từ tiếng Việt"),
  new SlashCommandBuilder()
    .setName("stopword")
    .setDescription("Dừng trò chơi nối từ"),
].map((cmd) => cmd.toJSON());

//lấy 2 từ ngẫu nhiên
function getRandomWords(dictionarySet) {
  const words = Array.from(dictionarySet);
  const finalWord = words[Math.floor(Math.random() * words.length)];

  return finalWord;
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Đã đăng ký lệnh slash.");
  } catch (err) {
    console.error(err);
  }
}
registerCommands();

client.on("ready", () => {
  console.log(`Bot đã đăng nhập với tên ${client.user.tag}`);
});

// Xử lý lệnh slash
// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;

//   if (interaction.commandName === "startword") {
//     gameOn = true;
//     const firstPhrase = getRandomWords(twoWordDic);
//     const [firstWord, secondWord] = firstPhrase.split(" ");
//     lastSecondWord = secondWord;
//     lastSecondWord = null;
//     usedPhrases.add(firstPhrase);
//     scores.clear();
//     await interaction.reply(
//       `🎮 **Bắt đầu trò chơi nối từ tiếng Việt!**\nTừ bắt đầu:${firstPhrase}`
//     );
//   }

//   if (interaction.commandName === "stopword") {
//     gameOn = false;
//     lastSecondWord = null;
//     usedPhrases.clear();
//     scores.clear();
//     await interaction.reply(`🛑 Trò chơi đã dừng.\n\n`);
//   }
// });

// Sự kiện nhận tin nhắn
client.on("messageCreate", async(msg) => {
  if (msg.author.bot) return;

  const content = msg.content.trim().toLowerCase();

  if (content === "!start") {   
    gameOn = true;
    const firstPhrase = getRandomWords(twoWordDic);
    const [firstWord, secondWord] = firstPhrase.split(" ");
    lastSecondWord = secondWord;
    lastSecondWord = null;
    usedPhrases.add(firstPhrase);
    scores.clear();    
    msg.reply(
      `🎮 **Bắt đầu trò chơi nối từ tiếng Việt!**\nTừ bắt đầu:${firstPhrase}`
    );
  }

  if (content === "!stop"){
     // Tạo bảng điểm cuối game
    let scoreBoard = "🏆 **Bảng điểm cuối game:**\n";
    const sortedScores = Array.from(scores.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedScores.forEach(([id, point]) => {
      scoreBoard += `<@${id}>: **${point} điểm**\n`;
    });
    gameOn = false;
    lastSecondWord = null;
    usedPhrases.clear();
    scores.clear();
    msg.reply(`🛑 Trò chơi đã dừng.\n\n${scoreBoard}`);
  }

  if (!gameOn) return;

  if (content === "!diem") {
    let text = "🏆 **Bảng điểm:**\n";
    if (scores.size === 0) return msg.reply("Chưa có điểm nào.");

    for (let [id, point] of scores.entries()) {
      text += `<@${id}>: **${point} điểm**\n`;
    }
    msg.reply(text);
    return;
  }

  const parts = content === "!start" ? []: content.split(" ");

  // Phải có 2 từ
  if (content != "!start" && parts.length !== 2) {
    msg.reply("❌ Bạn phải nhập 2 từ");
    return;
  }

  const [firstWord, secondWord] = parts;

  // Lấy tất cả cụm 2 từ chưa dùng và bắt đầu bằng secondWord
  const nextOptions = twoWordDic.filter((p) => {
    if (usedPhrases.has(p)) return false;
    return p.split(" ")[0] === secondWord;
  });

  if (nextOptions.length === 0) {
    // Tạo bảng điểm cuối game
    let scoreBoard = "🏆 **Bảng điểm cuối game:**\n";
    const sortedScores = Array.from(scores.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    sortedScores.forEach(([id, point]) => {
      scoreBoard += `<@${id}>: **${point} điểm**\n`;
    });
    gameOn = false;
    lastSecondWord = null;
    usedPhrases.clear();
    scores.clear();
    msg.reply(
      `⚠️ Không còn từ nối tiếp hợp lệ! Game kết thúc.\n\n${scoreBoard}`
    );
    return;
  }

  // Kiểm tra hợp lệ theo từ điển
  if (!isValidVietnameseWord(content)) {
    msg.reply("❌ Từ này không có trong từ điển!");
    return;
  }

  // Không lặp cụm
  if (usedPhrases.has(content)) {
    msg.reply("❌ Cụm này đã dùng rồi, hãy nhập cụm khác!");
    return;
  }

  // Nếu là cụm đầu tiên
  if (!lastSecondWord) {
    lastSecondWord = secondWord;
    usedPhrases.add(content);
    msg.reply(
      `✔ Bắt đầu với **${content}**\nCụm tiếp theo phải bắt đầu bằng **"${secondWord}"**`
    );
    return;
  }

  // Kiểm tra xem từ thứ nhất phải bằng từ thứ 2 trước đó
  if (firstWord !== lastSecondWord) {
    msg.reply(`❌ Sai rồi! Cụm phải bắt đầu bằng **"${lastSecondWord}"**.`);
    return;
  }

  // Hợp lệ → cập nhật
  usedPhrases.add(content);
  lastSecondWord = secondWord;

  // +1 điểm
  let current = scores.get(msg.author.id) || 0;
  scores.set(msg.author.id, current + 1);

  msg.reply(`✔ Hợp lệ! Từ kế tiếp phải bắt đầu bằng **"${secondWord}"**`);
});

client.login(process.env.BOT_TOKEN);
