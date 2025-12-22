const { PermissionsBitField } = require('discord.js');
const Money = require("../utils/currency");
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const {DEVELOPER_IDS} = require('../utils/constant.js');

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
    
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || DEVELOPER_IDS.includes(message.author.id);
    const senderId = message.author.id;

    try {
      // SỬA LỖI TẠI ĐÂY: Sử dụng cache thay vì fetch() toàn bộ để tránh Timeout
      // Nếu bot của bạn có bật GuildMembers Intent, cache sẽ chứa đủ mem.
      const targetMembers = message.guild.members.cache.filter(member => !member.user.bot);
      const totalMembers = targetMembers.size;
      const totalCost = amount * totalMembers;

      if (!isAdmin) {
        const senderBalance = await Money.getBalance(senderId, currencyType);
        if (senderBalance < totalCost) {
          return message.reply(
            `${errorIcon} | Bạn cần **${totalCost.toLocaleString()}** để lì xì cho **${totalMembers}** người, nhưng bạn không đủ số dư!`
          );
        }
        await Money.removeMoney(senderId, totalCost, currencyType);
      }

      // Thông báo đang xử lý nếu số lượng mem lớn
      const processingMsg = await message.channel.send(`⏳ Đang phát lì xì cho **${totalMembers}** thành viên...`);

      // Sử dụng vòng lặp for thay vì Promise.all nếu số lượng mem cực lớn để tránh làm nghẽn Database
      for (const [id, member] of targetMembers) {
        await Money.addMoney(member.id, amount, currencyType);
      }

      return processingMsg.edit(
        `🎊 **LÌ XÌ TỔNG LỰC!** 🎊\n${verifyIcon} | **${message.author.username}** đã lì xì **${amount.toLocaleString()}** ${Money.getIcon(currencyType)} cho tất cả **${totalMembers}** thành viên!${isAdmin ? '' : `\nTổng chi: **${totalCost.toLocaleString()}** ${Money.getIcon(currencyType)}`}`
      );

    } catch (error) {
      console.error("Lỗi khi thực hiện lệnh lixi:", error);
      return message.reply(`${errorIcon} | Đã xảy ra lỗi khi thực hiện phát lì xì.`);
    }
  },
};