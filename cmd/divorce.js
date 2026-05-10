const { renderKey, setKey, getKey } = require('../utils/db');
const { getBalance, removeMoney, getIcon } = require("../utils/currency.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js'); //

module.exports = {
  name: "divorce",
  aliases: ["lyhon"],
  async execute(message) {
    const DIVORCE_FEE = 100000; // Phí ly hôn
    const guildId = message.guild.id;
    const authorId = message.author.id;

    // 1. Lấy danh sách cặp đôi
    const coupleKey = renderKey('couple', guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    // 2. Kiểm tra tình trạng hôn nhân
    const coupleIndex = couplesList.findIndex(c => c.husband === authorId || c.wife === authorId);

    if (coupleIndex === -1) {
      return message.reply("❌ Bạn hiện đang độc thân, không thể thực hiện thủ tục ly hôn!");
    }

    // 3. Kiểm tra số dư tài khoản
    const balance = await getBalance(authorId, "mora");
    if (balance < DIVORCE_FEE) {
      return message.reply(`❌ Bạn không đủ tiền để ly hôn! Thủ tục này tốn **${DIVORCE_FEE.toLocaleString()}** ${getIcon("mora")}.`);
    }

    const coupleInfo = couplesList[coupleIndex];
    const partnerId = coupleInfo.husband === authorId ? coupleInfo.wife : coupleInfo.husband;

    // 4. Tạo nút xác nhận
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_divorce')
          .setLabel('Đồng ý ly hôn')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_divorce')
          .setLabel('Từ chối')
          .setStyle(ButtonStyle.Secondary),
      );

    const askMsg = await message.reply({
      content: `💔 <@${partnerId}> ơi, <@${authorId}> muốn ly hôn với bạn. Bạn có đồng ý ký đơn không?\n*(Phí thủ tục **${DIVORCE_FEE.toLocaleString()}** ${getIcon("mora")} sẽ do <@${authorId}> chi trả)*`,
      components: [row]
    });

    // 5. Tạo bộ thu thập phản hồi từ đối phương
    const filter = i => i.user.id === partnerId;
    const collector = askMsg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_divorce') {
        try {
          // Thực hiện trừ tiền người yêu cầu
          await removeMoney(authorId, DIVORCE_FEE, "mora");

          // Cập nhật lại danh sách sau khi lấy mới (tránh trùng lặp dữ liệu)
          const latestCouples = (await getKey(coupleKey)) || [];
          const newIndex = latestCouples.findIndex(c => c.husband === authorId || c.wife === authorId);
          
          if (newIndex !== -1) {
            latestCouples.splice(newIndex, 1);
            await setKey(coupleKey, latestCouples);
          }

          await i.update({
            content: `💔 **LY HÔN THÀNH CÔNG**\n<@${authorId}> và <@${partnerId}> đã chính thức đường ai nấy đi.\n💸 <@${authorId}> đã thanh toán phí thủ tục.`,
            components: []
          });
        } catch (error) {
          console.error("Lỗi ly hôn:", error);
          await i.update({ content: "❌ Có lỗi xảy ra trong quá trình xử lý.", components: [] });
        }
      } else {
        await i.update({
          content: `💖 <@${partnerId}> đã từ chối ly hôn! Hai bạn hãy ngồi lại nói chuyện với nhau nhé.`,
          components: []
        });
      }
      collector.stop();
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        askMsg.edit({ content: "⌛ Hết thời gian chờ đợi, yêu cầu ly hôn đã bị hủy bỏ.", components: [] }).catch(() => null);
      }
    });
  }
};