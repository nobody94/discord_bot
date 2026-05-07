const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const { addMoney, removeMoney, getIcon,getBalance } = require("../utils/currency.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");

module.exports = {
  name: "rob",
  aliases: ["cuoptien", "ct"],
  description: "Khởi động một phi vụ cướp ngân hàng",
  async execute(message, args) {
    const isDev = DEVELOPER_IDS.includes(message.author.id);
    const isAdmin = message.member.permissions.has(
      PermissionFlagsBits.ManageChannels
    );

    if (!isDev && !isAdmin) {
      return message.reply(
        `${errorIcon} | Chỉ Dev hoặc Quản lý kênh mới có thể phát động phi vụ này!`
      );
    }

    const FINE_AMOUNT = 5000;
    const maxAmount = 2000000;
    const minAmount = 1000000;
    let participants = new Set();    

    const bankVault = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    const calculateChance = (count) => Math.min(5 + (count - 1) * 5, 70);
    const getMentions = () =>
      Array.from(participants)
        .map((id) => `<@${id}>`)
        .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("🏦 PHI VỤ CƯỚP NGÂN HÀNG BẮC QUỐC")
      .setColor("#ff0000")
      .setDescription(
        `**${message.author.username}** đã phát động phi vụ!\n\n` +
          `💰 **Giá trị hầm:** ~${bankVault.toLocaleString()} ${getIcon(
            "mora"
          )}\n` +
          `👥 **Đồng bọn:** ${participants.size} người\n${getMentions()}\n` +
          `🎯 **Tỉ lệ thành công:** ${calculateChance(
            participants.size
          )}%\n\n` +
          `*Nhấn nút để tham gia. Càng đông tỉ lệ thắng càng cao!*`
      )
      .setFooter({ text: "Phi vụ tự hủy sau 2 phút nếu không bắt đầu." });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join_rob")
        .setLabel("Tham Gia")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👥"),
      new ButtonBuilder()
        .setCustomId("start_rob")
        .setLabel("Bắt Đầu")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🔫"),
      new ButtonBuilder()
        .setCustomId("cancel_rob")
        .setLabel("Hủy")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✖️")
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 120000 });
   

    collector.on("collect", async (interaction) => {
      const isStarter = interaction.user.id === message.author.id;
      const canControl = isStarter || isDev;

      // Xử lý Tham gia (Ai cũng có thể bấm)
      if (interaction.customId === "join_rob") {
        if (participants.has(interaction.user.id)) {
          return interaction.reply({
            content: "Bạn đã tham gia phi vụ này rồi!",
            ephemeral: true,
          });
        }
        const userBalance = await getBalance(interaction.user.id, "mora");
        if (userBalance < FINE_AMOUNT) {
          return interaction.reply({
            content: `❌ Bạn không có đủ **${FINE_AMOUNT.toLocaleString()}** ${getIcon("mora")} để tham gia. Bạn cần đủ tiền để phòng hờ bị cảnh sát bắt!`,
            ephemeral: true,
          });
        }
        participants.add(interaction.user.id);

        embed.setDescription(
          `**${message.author.username}** đã phát động phi vụ!\n\n` +
            `💰 **Giá trị hầm:** ~${bankVault.toLocaleString()} ${getIcon(
              "mora"
            )}\n` +
            `👥 **Đồng bọn:** ${participants.size} người\n${getMentions()}\n` +
            `🎯 **Tỉ lệ thành công:** ${calculateChance(participants.size)}%`
        );
        return await interaction.update({ embeds: [embed] });
      }

      // Xử lý Bắt đầu (CHỈ NGƯỜI TẠO HOẶC DEV)
     if (interaction.customId === "start_rob" || interaction.customId === "cancel_rob") {
        const isStarter = interaction.user.id === message.author.id;
        const isDev = DEVELOPER_IDS.includes(interaction.user.id); //
        //&& !isDev
        if (!isStarter) {
          return interaction.reply({
            content: `❌ Chỉ có chủ mưu (<@${message.author.id}>) mới có quyền bấm nút này!`,
            ephemeral: true,
          });
        }

        // Nếu đã vượt qua kiểm tra quyền ở trên, mới xử lý lệnh
        if (interaction.customId === "start_rob") {
          await interaction.deferUpdate();
          return collector.stop("started"); // Dừng collector và thoát hàm
        }

        if (interaction.customId === "cancel_rob") {
          // Không cần deferUpdate vì ở sự kiện 'end' sẽ edit message
          return collector.stop("cancelled"); // Dừng collector và thoát hàm
        }
      }   
    });

    collector.on("end", async (collected, reason) => {
      // Xử lý các trạng thái kết thúc collector
      if (reason === "cancelled") {
        return msg.edit({
          content: "❌ Phi vụ đã bị hủy bởi chủ mưu.",
          embeds: [],
          components: [],
        });
      }

      if (reason === "time") {
        return msg.edit({
          content: "⏰ Đã quá thời gian chuẩn bị, phi vụ tự động giải tán.",
          embeds: [],
          components: [],
        });
      }

      if (reason === "started") {
        // ... (Logic đếm ngược và trả kết quả giữ nguyên như cũ)
        let timeLeft = 10;
        const disabledRow = new ActionRowBuilder().addComponents(
          row.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
        );

        const fightEmbed = new EmbedBuilder()
          .setTitle("🚨 ĐANG ĐỘT NHẬP NGÂN HÀNG...")
          .setColor("#f39c12")
          .setDescription(
            `Các tay súng đang nổ súng khống chế bảo vệ!\n\n⏳ Kết quả sau: **${timeLeft} giây**\n👥 Quân số: **${participants.size}** người.\n${getMentions()}`
          );

        await msg.edit({ embeds: [fightEmbed], components: [disabledRow] });

        const countdown = setInterval(async () => {
          timeLeft--;
          if (timeLeft > 0) {
            fightEmbed.setDescription(
              `Các tay súng đang nổ súng khống chế bảo vệ!\n\n⏳ Kết quả sau: **${timeLeft} giây**\n👥 Quân số: **${participants.size}** người.\n${getMentions()}`
            );
            await msg
              .edit({ embeds: [fightEmbed] })
              .catch(() => clearInterval(countdown));
          } else {
            clearInterval(countdown);
            const finalChance = calculateChance(participants.size);
            const isSuccess = Math.random() * 100 < finalChance;
            const resultEmbed = new EmbedBuilder().setTitle(
              "🚨 KẾT QUẢ PHI VỤ"
            );

            if (isSuccess) {
              const individualShare = Math.floor(bankVault / participants.size);
              for (const pId of participants) {
                await addMoney(pId, individualShare, "mora");
              }
              resultEmbed
                .setColor("#2ecc71")
                .setDescription(
                  `🎉 **THÀNH CÔNG RỰC RỠ!**\n\n💰 Tổng thu: **${bankVault.toLocaleString()}** ${getIcon(
                    "mora"
                  )}\n💰 Mỗi người nhận: **${individualShare.toLocaleString()}** ${getIcon(
                    "mora"
                  )}`
                );
            } else {              
              for (const pId of participants) {
                await removeMoney(pId, FINE_AMOUNT, "mora").catch(() => {});
              }
              resultEmbed
                .setColor("#e74c3c")
                .setDescription(
                  `🚔 **PHI VỤ THẤT BẠI!**\n\nCảnh sát đã tóm gọn cả nhóm. Mỗi người tốn **${FINE_AMOUNT.toLocaleString()}** ${getIcon(
                    "mora"
                  )} để tại ngoại.`
                );
            }

            await msg.reply({
              content: `🔔 **Kết quả:** ${getMentions()}`,
              embeds: [resultEmbed],
            });
            await msg.edit({ components: [] }).catch(() => {});
          }
        }, 1000);
      }
    });
  },
};
