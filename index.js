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

const app = express();
app.get('/', (req, res) => {
  res.send('Server is running!');
});
app.listen(3000, () => {
  console.log('Bot is ready!');
});
// const keep_alive = require('./keep_alive.js');

// const ViWordchain = require("./game/wordchain-vi");
const {WordChain} = require("./game/wordchain");
const { getGameChannelId } = require("./game/game_settings");
// const Money = require("./utils/currency");

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
      await command.execute(message, args, commandName);
    } catch (error) {
      console.error(error);
      message.reply("Đã xảy ra lỗi khi thực thi lệnh này!");
    }
    return; // Dừng xử lý sau khi xử lý lệnh
  }

  //xử lý game
  if (!content.startsWith(PREFIX)) {
    // if (ViWordchain.isGameActive()) {
    //   if (gameChannelId && message.channelId !== gameChannelId) {
    //     return; // Bỏ qua nếu tin nhắn không ở đúng kênh game
    //   }

    //   if (ViWordchain.isRepeatPlayer(message.author.id)) {
    //     return message.reply({
    //       content:
    //         "⚠️ Bạn vừa mới trả lời rồi, hãy đợi người khác nối tiếp nhé!",
    //       allowedMentions: { repliedUser: false },
    //     });
    //   }

    //   const result = ViWordchain.gameProcess(content);

    //   if (result.success) {
    //     const userId = message.author.id;
    //     const tienThuong = 100;
    //     ViWordchain.setLastUser(message.author.id);

    //     await Money.addMoney(userId, tienThuong);

    //     await message.channel.send(
    //       `✅ Từ hợp lệ ${message.author.username} được thưởng 100 ${Money.currencyIcon}\n` +
    //         `Từ tiếp theo phải bắt đầu bằng **"${result.nextRequiredWord}".`
    //     );
    //   } else {
    //     let replyMessage = result.message;
    //     if (result.reason == "OUT_OF_WORD") {
    //       const bonusReward = 500;
    //       await Money.addMoney(userId, bonusReward);
    //       await message.reply({
    //         content: `${replyMessage}\n ${message.author.username} được thưởng 500 ${Money.currencyIcon}`,
    //         allowedMentions: { repliedUser: false },
    //       });
    //       ViWordchain.stopGame();
    //       setTimeout(() => {
    //         const newStart = ViWordchain.getRandomWords();
    //         ViWordchain.startGame(newStart);
    //         message.channel.send(
    //           `🔄 **Ván mới bắt đầu!** Từ bắt đầu: **${newStart}**`
    //         );
    //       }, 3000);
    //     } else {
    //       await message.reply({
    //         content: replyMessage,
    //         allowedMentions: { repliedUser: false },
    //       });
    //     }
    //   }
    // }
    WordChain(message);
  }
});

// 🖱️ Xử lý Tương tác Nút (Button Interaction Handler)
client.on("interactionCreate", async (interaction) => {
  //  Xử lý Modal Submit (Khi người dùng gửi form nhập tiền)
  if (interaction.type === InteractionType.ModalSubmit) {
    // 1. Kiểm tra xem đây có phải là Modal Tài Xỉu không
    if (interaction.customId.startsWith("taixiu_bet_modal_")) {
      // Phản hồi Interaction (BẮT BUỘC)
      // await interaction.deferReply().catch((e) => {
      //   // Nếu đã defer hoặc reply rồi, catch lỗi nhưng KHÔNG THOÁT
      //   console.warn("Đã cố gắng Defer/Reply lại một tương tác đã xử lý.");
      //   return;
      // });

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
