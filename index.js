require('dotenv').config();
const { Client,Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const GameManager = require("./game/wordchain-vi");
const { getGameChannelId } = require("./game/game_settings");

const Token = process.env.BOT_TOKEN;
const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();

const commandsPath = path.join(__dirname, "cmd");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.name && command.execute) {
    client.commands.set(command.name, command);
  } else {
    console.log(`[Cảnh báo] Lệnh tại ${filePath} thiếu 'name' hoặc 'execute'.`);
  }
}

client.on("ready", () => {
  console.log(`✅ Bot ${client.user.tag} đã sẵn sàng!`);
});

client.on("messageCreate", async (message) => {
  // Bỏ qua tin nhắn của bot
  if (message.author.bot) return;

  // Lấy ID kênh đã thiết lập
  const gameChannelId = getGameChannelId(message.guildId);

  const content = message.content.trim();
  //xử lý lệnh
  if (content.startsWith(PREFIX)) {
    const args = content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) return;

    // Kiểm tra quyền (nếu lệnh có yêu cầu)
    if (
      command.userPermissions &&
      !message.member.permissions.has(command.userPermissions)
    ) {
      return message.reply({
        content: "❌ Bạn không có quyền thực hiện lệnh này.",
        allowedMentions: { repliedUser: false },
      });
    }

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply("Đã xảy ra lỗi khi thực thi lệnh này!");
    }
    return; // Dừng xử lý sau khi xử lý lệnh
  }

  //xử lý game
  if (!content.startsWith(PREFIX) && GameManager.isGameActive()) {
    if (gameChannelId && message.channelId !== gameChannelId) {
      return; // Bỏ qua nếu tin nhắn không ở đúng kênh game
    }
    const result = GameManager.gameProcess(content);

    if (result.success) {
      await message.channel.send(
        `✅ **Từ hợp lệ\n` +
          `Từ tiếp theo phải bắt đầu bằng **"${result.nextRequiredWord}"**.`
      );
    } else {
      let replyMessage = result.message;  
      await message.reply({
        content: replyMessage,
        allowedMentions: { repliedUser: false },
      });
    }
  }
});

client.login(Token);
