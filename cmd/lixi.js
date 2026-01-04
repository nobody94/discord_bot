const { PermissionsBitField } = require('discord.js');
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
    
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || DEVELOPER_IDS.includes(message.author.id);
    const senderId = message.author.id;

    try {
      // Lấy danh sách thành viên từ cache
      const targetMembers = message.guild.members.cache.filter(member => !member.user.bot);
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
      let listDisplay = receivedUsers.join(", ");
      if (receivedUsers.length > 30) {
        listDisplay = receivedUsers.slice(0, 30).join(", ") + ` và **${totalMembers - 30}** người khác...`;
      }

      return processingMsg.edit(
        `🎊 **LÌ XÌ TỔNG LỰC!** 🎊\n` +
        `${verifyIcon} | **${message.author.username}** đã lì xì **${amount.toLocaleString()}** ${Money.getIcon(currencyType)} cho:\n` +
        `> ${listDisplay}\n\n` +
        `✅ Tổng cộng: **${totalMembers}** thành viên đã nhận lộc!${isAdmin ? '' : `\n💸 Tổng chi: **${totalCost.toLocaleString()}** ${Money.getIcon(currencyType)}`}`
      );

    } catch (error) {
      console.error("Lỗi lệnh Lixi:", error);
      return message.reply("❌ | Có lỗi xảy ra khi đang phát lì xì!");
    }
  }
};