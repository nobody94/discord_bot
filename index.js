require("dotenv").config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require('express');
const { WordChain } = require("./game/wordchain");

const app = express();
app.get('/', (req, res) => {
  console.log('--- Có tín hiệu Ping từ UptimeRobot! ---');
  res.send('Server is running!');
});
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// const Token = process.env.BOT_TOKEN;
const Token = process.env.BOT_TEST_TOKEN;

const PREFIX = ".";
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
  if (!message) return;
  if (message.author.bot) return;

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
      await command.execute(message, args, commandName, client);
    } catch (error) {
      console.error(error);
      message.reply("Đã xảy ra lỗi khi thực thi lệnh này!");
    }
    return; // Dừng xử lý sau khi xử lý lệnh
  }

  //xử lý game
  if (!content.startsWith(PREFIX)) {
    WordChain(message);
  }
});

// 🖱️ Xử lý Tương tác (Button, Modal, Select Menu, v.v.)
client.on("interactionCreate", async (interaction) => {  
  // 1. XỬ LÝ NÚT BẤM (Button Interaction)
  if (interaction.isButton()) {
    // Kiểm tra nếu là các nút của trò chơi Tài Xỉu
    if (interaction.customId.startsWith("tx_")) {
      const command = client.commands.get("taixiu");
      if (command && command.handleInteraction) {
        return await command.handleInteraction(interaction);
      }
    }

    // Kiểm tra nếu là các nút của trò chơi Dice (Xúc xắc)
    if (interaction.customId.startsWith("dice_")) {
      const command = client.commands.get("dice");
      if (command && command.handleInteraction) {
        return await command.handleInteraction(interaction);
      }
    }
  }

  // 2. XỬ LÝ GỬI FORM (Modal Submit Interaction)
  if (interaction.type === InteractionType.ModalSubmit) {
    // Kiểm tra Modal của trò chơi Tài Xỉu
    if (interaction.customId.startsWith("modal_tx_")) {
      const command = client.commands.get("taixiu");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL TÀI XỈU:", error);
        }
      }
    }

    // Kiểm tra Modal của trò chơi Dice
    if (interaction.customId.startsWith("modal_dice_")) {
      const command = client.commands.get("dice");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL DICE:", error);
        }
      }
    }
  }
});

client.login(Token);
