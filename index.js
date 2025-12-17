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
const { db } = require('./utils/currency');

const app = express();
app.get('/', (req, res) => {
  res.send('Server is running!');
});
app.listen(3000, () => {
  console.log('Bot is ready!');
});
// const keep_alive = require('./keep_alive.js');


const Token = process.env.BOT_TOKEN;
// const Token = process.env.BOT_TEST_TOKEN;

const PREFIX = ".";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();
client.db = db;

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
      // if (["setwordchain-vi", "noichu-vi"].includes(content)) {
      //   await client.db.set(`lang_${message.channel.id}`, 'vi');
      //   console.log('Đã bật chế độ Tiếng Việt')
      //   // return message.reply("✅ Đã bật chế độ Tiếng Việt!");
      // }
      // if (["setwordchain-en", "noichu-en"].includes(content)) {
      //   await client.db.set(`lang_${message.channel.id}`, 'en');
      //   console.log('Đã bật chế độ Tiếng Anh')
      //   // return message.reply("✅ Đã bật chế độ Tiếng Việt!");
      // }
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

// 🖱️ Xử lý Tương tác Nút (Button Interaction Handler)
client.on("interactionCreate", async (interaction) => {
  //  Xử lý Modal Submit (Khi người dùng gửi form nhập tiền)
  if (interaction.type === InteractionType.ModalSubmit) {
    // 1. Kiểm tra xem đây có phải là Modal Tài Xỉu không
    if (interaction.customId.startsWith("taixiu_bet_modal_")) {
      // Thực thi Logic Game
      const command = client.commands.get("taixiu");

      try {
        if (command && command.handleModalSubmit) {
          await command.handleModalSubmit(interaction);
        }
      } catch (error) {
        console.error("LỖI TRONG handleModalSubmit SAU DEFER:", error);
        // Gửi thông báo lỗi chung nếu logic game thất bại
        // interaction.editReply(
        //   `❌ Đã xảy ra lỗi hệ thống nghiêm trọng. Vui lòng kiểm tra console.`
        // );
      }
    }
  }

  // Xử lý nút Tài Xỉu
  if (interaction.type === InteractionType.MessageComponent) {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith("tx_")) {
        const command = client.commands.get("taixiu");
        if (command) {
          command.handleButton(interaction);
          return; // Rất quan trọng: Ngăn chặn code tiếp theo chạy
        }
      }
    }
  }
});

client.login(Token);
