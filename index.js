require("dotenv").config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
  Events,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const { db } = require("./utils/db");

const { wordleProcess } = require("./game/wordleHandler");
const { wordchainHandler } = require("./game/wordchainHandler");
const { errorIcon } = require("./utils/icon");

const express = require("express");
const app = express();
app.get("/", (req, res) => {
  console.log("--- Có tín hiệu Ping từ UptimeRobot! ---");
  res.send("Server is running!");
});
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

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

// client.on("debug", console.log);
// client.on("warn", console.warn);
// client.on("error", console.error);
// client.on("shardError", console.error);

client.once(Events.ClientReady, (c) => {
  console.log(`Bot ${c.user.tag} đã sẵn sàng và đang hoạt động!`);
});

// client.on("ready", () => {
//   console.log(`Bot ${client.user.tag} đã sẵn sàng!`);
// });

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
        content: `${errorIcon} Bạn không có quyền thực hiện lệnh này.`,
        allowedMentions: { repliedUser: false },
      });
    }

    try {
      await command.execute(message, args, commandName);
    } catch (error) {
      console.error(error);
      message.reply("Đã xảy ra lỗi khi thực thi lệnh này!");
    }
    return; // Dừng xử lý sau khi xử lý lệnh
  }

  //xử lý game
  await wordleProcess(message);
  await wordchainHandler(message);
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

    // Kiểm tra nút của lệnh ăn xin
    if (interaction.customId.startsWith("open_give_modal_")) {
      const command = client.commands.get("anxin");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL anxin:", error);
        }
      }
    }
    // Kiểm tra nút của đổi tiền
    if (interaction.customId.startsWith("exchange_")) {
      // Lấy giá trị từ các trường input trong modal
      const command = client.commands.get("exchange");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ Nút SUBMIT ĐỔi tiền:", error);
        }
      }
    }
    //baucua
    if (interaction.customId.startsWith("bc_")) {
      const command = client.commands.get("baucua");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ Nút SUBMIT baucua:", error);
        }
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
    // Kiểm tra Modal của ANXIN
    if (interaction.customId.startsWith("confirm_give_modal_")) {
      const command = client.commands.get("anxin");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL SUBMIT ANXIN:", error);
        }
      }
    }
    // Kiểm tra Modal của đổi tiền
    if (interaction.customId.startsWith("exchange_modal_")) {
      // Lấy giá trị từ các trường input trong modal
      const command = client.commands.get("exchange");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL SUBMIT ĐỔi tiền:", error);
        }
      }
    }
    if (interaction.customId.startsWith("modal_bc_")) {
      const command = client.commands.get("baucua");
      if (command && command.handleInteraction) {
        try {
          return await command.handleInteraction(interaction);
        } catch (error) {
          console.error("LỖI XỬ LÝ MODAL SUBMIT ĐỔi tiền:", error);
        }
      }
    }
  }
});


async function startBot() {
  try {
    // Chỉ nên kết nối DB và Login khi Server Express đã sẵn sàng
    await db.connect();
    console.log("✅ Đã kết nối MongoDB thành công!");
    console.log("--- ĐANG CHUẨN BỊ LOGIN ---");

    if (!Token) return console.error(`${errorIcon} BOT_TOKEN missing!`);

    // Kiểm tra nếu client đã login rồi thì không login lại
    client
      .login(Token)
      .then(() => {
        console.log("🔑 Login request sent to Discord");
      })
      .catch((err) => {
        console.error("❌ Discord login failed:", err);
      });
    // if (!client.readyAt) {
    //   await client.login(Token);
    //   console.log("Bot đã đăng nhập thành công!");
    // }
  } catch (error) {
    console.error("Lỗi khởi động:", error);
    process.exit(1);
  }
}
// Chạy hàm khởi động
startBot();
