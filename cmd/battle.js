const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const { getKey, setKey, renderKey } = require("../utils/db");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { getBalance, removeMoney, getIcon } = require("../utils/currency");
const {getHealthStatus} = require('../utils/health.js');

module.exports = {
  name: "battle",
  description: "Tham gia hoặc rời trận đấu",
  async execute(message, args) {
    const subCommand = args[0]?.toLowerCase();
    const guildId = message.guild.id;
    const userId = message.author.id;
    const currencyType = "mora";
    const fee = 10000;
    let totalFee = fee;

    const battleKey = renderKey("battle", guildId);
    let lobby = (await getKey(battleKey)) || [];

    if (subCommand === "join") {
      if (lobby.includes(userId)) {
        return message.reply("Bạn đã tham gia trận đấu này rồi.");
      }

      const userBalance = await getBalance(userId, currencyType);

      if (userBalance < fee) {
        return message.reply(
          `Bạn không đủ ${fee.toLocaleString()}${getIcon(currencyType)} để tham gia trận đấu.`,
        );
      }

      const success = await removeMoney(userId, fee, currencyType);

      if (success) {
        lobby.push(userId);
        await setKey(battleKey, lobby);
        return message.reply(
          `${verifyIcon} | **${message.author.username}** đã gia nhập trận chiến ném đồ! (Hiện có: ${lobby.length} người tham gia)`,
        );
      } else {
        return message.reply(
          `${errorIcon} | Giao dịch thất bại do lỗi hệ thống.`,
        );
      }
    }

    if (subCommand === "out") {
      if (!lobby.includes(userId)) {
        return message.reply("Bạn chưa tham gia trận đấu này.");
      }
      const healhKey = renderKey("health", userId);
      const currentHP = (await getKey(healhKey)) ?? 100;
      const status = getHealthStatus(currentHP);

      let hpMsg = '';
      let feeMsg = '';

      if(status.fee > 0){        
        totalFee += status.fee;
        hpMsg += ` và mất thêm ${status.fee.toLocaleString()}${getIcon(currencyType)} để hồi phục cho khỏe`;   
        feeMsg += ` và phí hồi phục sức khỏe:${status.fee.toLocaleString()}${getIcon(currencyType)}`     
      }

      const userBalance = await getBalance(userId, currencyType);
      
      if (userBalance < totalFee) {
        return message.reply(
          `Bạn không đủ ${fee.toLocaleString()}${getIcon(currencyType)}${feeMsg} để rời trận đấu.`,
        );
      }

      if(status.fee > 0){
        await setKey(healhKey, 100);
      }

      const success = await removeMoney(userId, totalFee, currencyType);

      if (success) {
        lobby = lobby.filter((id) => id !== userId);
        await setKey(battleKey, lobby);
        return message.reply(
          `🏃 | **${message.author.username}** đã rời khỏi trận đấu.\nBạn mất ${fee.toLocaleString()}${getIcon(currencyType)}${hpMsg}`,
        );
      } else {
        return message.reply(
          `${errorIcon} | Giao dịch thất bại do lỗi hệ thống.`,
        );
      }
    }

    if (subCommand === "list") {
      if (lobby.length === 0) {
        return message.reply("🏟️ Trận chiến ném đồ đang chưa có ai tham gia.");
      }

      const itemsPerPage = 10; 
      const totalPages = Math.ceil(lobby.length / itemsPerPage);
      let currentPage = 0;

      // Hàm tạo Embed danh sách dựa trên số trang hiện tại
      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = lobby.slice(start, end);

        const listContent = pageItems
          .map((id, index) => `**${start + index + 1}.** <@${id}>`)
          .join("\n");

        return new EmbedBuilder()
          .setTitle("🏟️ DANH SÁCH THÀNH VIÊN THAM CHIẾN")
          .setDescription(`Dưới đây là danh sách những người đang ở trong trận đấu:\n\n${listContent}`)
          .setColor(0x3498db)
          .setFooter({ text: `Trang ${page + 1}/${totalPages} • Tổng số: ${lobby.length} người` })
          .setTimestamp();
      };

      // Hàm tạo các nút điều hướng Trang
      const generateButtons = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev_page")
            .setLabel("Trang trước")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⬅️")
            .setDisabled(page === 0), // Vô hiệu hóa nếu ở trang đầu
          new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("Trang sau")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("➡️")
            .setDisabled(page === totalPages - 1) // Vô hiệu hóa nếu ở trang cuối
        );
      };

      // Gửi tin nhắn danh sách trang đầu tiên
      const listMessage = await message.reply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [generateButtons(currentPage)] : [], // Chỉ hiện nút nếu tổng trang > 1
      });

      if (totalPages <= 1) return; // Nếu chỉ có 1 trang thì không cần tạo bộ lắng nghe nút bấm

      // Tạo bộ thu thập nút bấm (Collector)
      const collector = listMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000, // Bộ nút tồn tại hoạt động trong 2 phút
      });

      collector.on("collect", async (i) => {
        // Tùy chọn bảo mật: Chỉ cho phép người gõ lệnh chuyển trang, tránh người khác bấm phá
        if (i.user.id !== message.author.id) {
          return i.reply({ content: "❌ Chỉ người dùng lệnh mới có quyền chuyển trang!", ephemeral: true });
        }

        if (i.customId === "prev_page" && currentPage > 0) {
          currentPage--;
        } else if (i.customId === "next_page" && currentPage < totalPages - 1) {
          currentPage++;
        }

        // Cập nhật lại giao diện trang mới
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      // Xử lý khi hết thời gian 2 phút (Khóa nút để tiết kiệm tài nguyên bot)
      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("prev").setLabel("Trang trước").setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId("next").setLabel("Trang sau").setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        await listMessage.edit({ components: [disabledRow] }).catch(() => {});
      });

      return;
    }

    if (subCommand === "invite") {
      let currentLobby = (await getKey(battleKey)) || [];
      if (!currentLobby.includes(userId)) {
        return message.reply(
          `${errorIcon} | Bạn chưa ở trong trận đấu không thể mời người khác.`,
        );
      }
      const target = message.mentions.users.first();
      if (!target) {
        return message.reply(`${errorIcon} | Vui lòng tag người bạn muốn mời.`);
      }
      if (target.id === userId) {
        return message.reply(`${errorIcon} | Bạn không thể tự mời chính mình.`);
      }

      if (target.bot) {
        return message.reply(`${errorIcon} | Bạn không thể mời bot.`);
      }

      // Tạo các nút bấm
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_battle_${userId}_${target.id}`)
          .setLabel("Chấp nhận")
          .setStyle(ButtonStyle.Success)
          .setEmoji("⚔️"),
        new ButtonBuilder()
          .setCustomId(`deny_battle_${userId}_${target.id}`)
          .setLabel("Từ chối")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🛡️"),
      );

      const embed = new EmbedBuilder()
        .setTitle("📩 Lời mời tới với trận chiến ném đồ")
        .setDescription(
          `**${message.author.username}** đã gửi một lời mời đến **<@${target.id}>**!\n\n*<@${target.id}> có 60 giây để phản hồi.*`,
        )
        .setColor(0xffa500)
        .setTimestamp();

      const response = await message.channel.send({
        content: `<@${target.id}>`,
        embeds: [embed],
        components: [row],
      });

      // Tạo bộ thu thập (Collector) để xử lý nút bấm
      const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === target.id, // Chỉ người được mời mới bấm được
        time: 60000, // Hết hạn sau 60s
      });

      collector.on("collect", async (i) => {
        if (i.customId.startsWith("accept_battle")) {
          const userBalance = await getBalance(target.id, currencyType);

          if (userBalance < fee) {
            await i.update({
              content: `Bạn không đủ ${fee.toLocaleString()}${getIcon(currencyType)} để tham gia trận đấu. `,
              embeds: [],
              components: [],
            });
          }

          const success = await removeMoney(target.id, fee, currencyType);
          if (success) {
            if (!currentLobby.includes(target.id)) {
              currentLobby.push(target.id);
            }

            await setKey(battleKey, currentLobby);

            await i.update({
              content: `✅ | <@${target.id}> đã chấp nhận lời mời!`,
              embeds: [],
              components: [],
            });
          } else {
            await i.update({
              content: `❌ |  Giao dịch thất bại do lỗi hệ thống. `,
              embeds: [],
              components: [],
            });
          }
        } else {
          await i.update({
            content: `❌ | <@${target.id}> đã từ chối lời mời.`,
            embeds: [],
            components: [],
          });
        }
        collector.stop();
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          response
            .edit({
              content: "⌛ | Lời mời đã hết hạn.",
              embeds: [],
              components: [],
            })
            .catch(() => {});
        }
      });
      return;
    }

    return message.reply(
      `Cách dùng: \`.battle join\`, \`.battle out\`, \`.battle list\` ,\`.battle invite\``,
    );
  },
};
