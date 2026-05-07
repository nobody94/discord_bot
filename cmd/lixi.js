const {
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const Money = require("../utils/currency");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
  name: "lixi",
  aliases: ["phatloc", "giveall"],
  description: "Lì xì tiền cho tất cả thành viên trong server (trừ Bot)",

  async execute(message, args) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply("⚠️ | Vui lòng nhập số tiền lì xì hợp lệ! Ví dụ: `.lixi 5000`.");
    }

    const currencyType = args[1] ? args[1].toLowerCase() : 'mora';
    const allowedCurrencies = ['mora', 'primo'];

    if (!allowedCurrencies.includes(currencyType)) {
      return message.reply(`${errorIcon} | Loại tiền không hợp lệ! Chỉ có thể lì xì **mora** hoặc **primo**.`);
    }

    //kiểm tra nợ và biên bản
    const isBlocked = await Money.checkPay(message, message.author.id);
    if (isBlocked) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || DEVELOPER_IDS.includes(message.author.id);
    const senderId = message.author.id;

    try {
      // Lấy danh sách thành viên từ cache      
      let targetMembers = message.guild.members.cache.filter(member =>
        !member.user.bot &&
        member.id !== senderId && // Không tự lì xì cho mình
        (member.presence?.status !== 'offline' || member.voice.channel)
      );

      if (isAdmin) {
        targetMembers = message.guild.members.cache.filter(member =>
          !member.user.bot &&          
          (member.presence?.status !== 'offline' || member.voice.channel)
        );
      }

      // if (isAdmin) {
      //   // Admin: Quét và fetch toàn bộ thành viên (kể cả offline)
      //   const allMembers = await message.guild.members.fetch();
      //   targetMembers = allMembers.filter(member => !member.user.bot);
      // } else {
      //   // Người dùng thường: Chỉ lì xì cho những người có trong cache (thường là đang online/hoạt động)
      //   // Điều này giúp tránh việc người dùng thường tiêu tốn quá nhiều tiền cho người offline
      //   targetMembers = message.guild.members.cache.filter(member => 
      //     !member.user.bot && 
      //     member.id !== senderId && // Không tự lì xì cho mình
      //     (member.presence?.status !== 'offline' || member.voice.channel) // Ưu tiên người online hoặc trong voice
      //   );
      // }

      const totalMembers = targetMembers.size;
      const totalCost = amount * totalMembers;

      if (totalMembers === 0) return message.reply("❌ | Không tìm thấy thành viên nào để lì xì!");

      if (!isAdmin) {
        const senderBalance = await Money.getBalance(senderId, currencyType);
        if (senderBalance < totalCost) {
          return message.reply(
            `${errorIcon} | Bạn cần **${totalCost.toLocaleString()}** để lì xì cho **${totalMembers}** người, nhưng bạn không đủ số dư!`
          );
        }
        await Money.removeMoney(senderId, totalCost, currencyType);
      }

      const processingMsg = await message.channel.send(`⏳ Đang phát lì xì cho **${totalMembers}** thành viên...`);

      let receivedUsers = [];
      // Sử dụng vòng lặp để add tiền và thu thập danh sách user
      for (const [id, member] of targetMembers) {
        await Money.addMoney(member.id, amount, currencyType);
        receivedUsers.push(`<@${member.id}>`);
      }

      // Xử lý hiển thị danh sách (tránh quá 2000 ký tự)
      const itemsPerPage = 10;
      let currentPage = 0;

      const generateMessageContent = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const currentList = receivedUsers.slice(start, end).join("\n> ");

        const totalPages = Math.ceil(receivedUsers.length / itemsPerPage);

        const embedContent = `🎊 **LÌ XÌ TỔNG LỰC!** 🎊\n` +
          `${verifyIcon} | **${message.author.username}** đã lì xì **${amount.toLocaleString()}** ${Money.getIcon(currencyType)} cho:\n` +
          `> ${currentList}\n\n` +
          `✅ Tổng cộng: **${totalMembers}** thành viên đã nhận lộc!\n` +
          `Trang: **${page + 1}/${totalPages}**`;

        // Tạo các nút bấm
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Trước')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Sau ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
        );

        return { content: embedContent, components: [row] };
      };

      // Gửi tin nhắn đầu tiên
      const response = await processingMsg.edit(generateMessageContent(currentPage));

      // Tạo Collector để lắng nghe sự kiện nhấn nút
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // Nút bấm có hiệu lực trong 60 giây
      });

      collector.on('collect', async (interaction) => {
        // Chỉ người dùng gõ lệnh mới có thể nhấn nút
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: "Bạn không có quyền chuyển trang!", ephemeral: true });
        }

        if (interaction.customId === 'prev') currentPage--;
        if (interaction.customId === 'next') currentPage++;

        await interaction.update(generateMessageContent(currentPage));
      });

      collector.on('end', () => {
        // Vô hiệu hóa nút bấm sau khi hết thời gian
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('p').setLabel('Trước').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('n').setLabel('Sau').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        response.edit({ components: [disabledRow] }).catch(() => null);
      });

    } catch (error) {
      console.error("Lỗi lệnh Lixi:", error);
      return message.reply("❌ | Có lỗi xảy ra khi đang phát lì xì!");
    }
  }
};