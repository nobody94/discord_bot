const { renderKey, pushKey, getKey, setKey } = require("../utils/db.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { getIcon, getBalance, removeMoney } = require("../utils/currency.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");
const { calculateInterest } = require("../utils/constant.js");

module.exports = {
  name: "bienban",
  description: "Hệ thống quản lý biên bản vi phạm chuyên sâu.",

  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const currencyType = "mora";
    const bbKey = renderKey("bienban", message.guild.id);
    const isDev = DEVELOPER_IDS.includes(message.author.id);

    try {
      // --- 1. LẬP BIÊN BẢN ---
      if (action === "lap") {
        if (!message.member.permissions.has("Administrator") && !isDev) {
          return message.reply(
            `${errorIcon} | Chỉ Dev và Admin mới có thể dùng.`,
          );
        }

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser || isNaN(amount) || amount <= 0) {
          return message.reply(
            `⚠️ Cách dùng: \`.bienban lap @user <số tiền>\``,
          );
        }

        await pushKey(bbKey, {
          userId: targetUser.id,
          date: new Date().toISOString(),
          money: amount,
        });
        return message.reply(
          `${verifyIcon} | Đã lập biên bản cho ${targetUser}: **${amount.toLocaleString()}** ${getIcon(currencyType)}.`,
        );
      }

      // --- 2. THANH TOÁN ---
      else if (action === "thanhtoan" || action === "nop") {
        const allBB = (await getKey(bbKey)) || [];
        const myBB = allBB.filter((bb) => bb.userId === message.author.id);

        if (myBB.length === 0) {
          return message.reply(`${errorIcon} | Bạn không có biên bản nào.`);
        }

        // Lấy STT từ người dùng, nếu không nhập thì mặc định là khoản 1 (cũ nhất)
        const stt = parseInt(args[1]) || 1;
        const targetIndex = stt - 1;

        if (isNaN(stt) || !myBB[targetIndex]) {
          return message.reply(
            `${errorIcon} | Không tìm thấy biên bản số **${stt}**. Hãy dùng \`.bienban check\` để xem danh sách.`,
          );
        }

        const targetBB = myBB[targetIndex];
        const { rate, days } = calculateInterest(targetBB.date);

        const interestMoney = Math.round(targetBB.money * rate);
        const totalToPay = targetBB.money + interestMoney;

        const userBalance = await getBalance(message.author.id, currencyType);
        if (userBalance < totalToPay) {
          return message.reply(
            `${errorIcon} | Bạn không đủ tiền. Cần **${totalToPay.toLocaleString()}** ${getIcon(currencyType)}.`,
          );
        }

        // Thực hiện trừ tiền
        await removeMoney(message.author.id, totalToPay, currencyType);

        // Tìm đúng vật thể đó trong mảng tổng allBB để xóa
        const realIndexInAll = allBB.indexOf(targetBB);
        allBB.splice(realIndexInAll, 1);
        await setKey(bbKey, allBB);

        return message.reply({
          embeds: [
            {
              title: `${verifyIcon} THANH TOÁN THÀNH CÔNG`,
              description: `Bạn đã trả biên bản số **${stt}**.\n> 💵 Gốc: **${targetBB.money.toLocaleString()}**\n> 📈 Lãi (${days} ngày): **${interestMoney.toLocaleString()}**`,
              color: 0x00ff00,
            },
          ],
        });
      }

      // --- 3. KIỂM TRA ---
      else if (action === "check") {
        const target = message.mentions.users.first() || message.author;
        const allBB = (await getKey(bbKey)) || [];
        const myBB = allBB.filter((bb) => bb.userId === target.id);

        if (myBB.length === 0) {
          return message.reply(
            `${verifyIcon} | **${target.username}** không có biên bản.`,
          );
        }

        let totalPrincipal = 0;
        let totalInterest = 0;

        const list = myBB
          .map((bb, i) => {
            const { rate, days } = calculateInterest(bb.date);
            const interest = Math.round(bb.money * rate);
            const total = bb.money + interest;
            totalPrincipal += bb.money;
            totalInterest += interest;

            return (
              `**${i + 1}.** \`${total.toLocaleString()}\` ${getIcon(currencyType)}\n` +
              `> 💵 Gốc: \`${bb.money.toLocaleString()}\` | 📈 Lãi: \`${(rate * 100).toFixed(0)}%\` (+${interest.toLocaleString()})\n` +
              `> 🗓️ Lập: <t:${Math.floor(new Date(bb.date).getTime() / 1000)}:R>`
            );
          })
          .join("\n");
        return message.reply({
          embeds: [
            {
              title: `📋 DANH SÁCH BIÊN BẢN: ${target.username.toUpperCase()}`,
              description: list,
              color: 0xffaa00,
              fields: [
                {
                  name: "Tổng cộng nợ phạt",
                  value: `**${(totalPrincipal + totalInterest).toLocaleString()}** ${getIcon(currencyType)}`,
                  inline: true,
                },
                {
                  name: "Chi tiết",
                  value: `Gốc: \`${totalPrincipal.toLocaleString()}\`\nLãi: \`${totalInterest.toLocaleString()}\``,
                  inline: true,
                },
              ],
              footer: { text: "Dùng .bienban thanhtoan để thanh toán." },
            },
          ],
        });
      }

      // --- 4. XEM TẤT CẢ (DEV) ---
      else if (action === "all") {
        if (!isDev) {
          return message.reply(`${errorIcon} | Chỉ Dev mới có thể dùng.`);
        }
        const allBB = (await getKey(bbKey)) || [];
        const listAll =
          allBB
            .map(
              (bb, i) =>
                `**${i + 1}.** <@${bb.userId}>: \`${bb.money.toLocaleString()}\` - <t:${Math.floor(new Date(bb.date).getTime() / 1000)}:R>`,
            )
            .join("\n") || "Trống";
        return message.reply({
          embeds: [
            {
              title: "📂 TOÀN BỘ BIÊN BẢN SERVER",
              description: listAll,
              color: 0x000000,
            },
          ],
        });
      }

      // --- 5. XÓA BIÊN BẢN (NÂNG CẤP) ---
      else if (action === "xoa") {
        if (!isDev) {
          return message.reply(`${errorIcon} | Chỉ Dev mới có thể dùng.`);
        }
        const target = message.mentions.users.first();
        const option = args[2]; // 'all' hoặc số thứ tự

        if (!target || !option)
          return message.reply(
            "⚠️ HD: `.bienban xoa @user all` hoặc `.bienban xoa @user 1` (số thứ tự trong lệnh check)",
          );

        let allBB = (await getKey(bbKey)) || [];

        if (option === "all") {
          // Xóa tất cả của user đó
          const newBB = allBB.filter((bb) => bb.userId !== target.id);
          await setKey(bbKey, newBB);
          return message.reply(
            `${verifyIcon} | Đã xóa **sạch** biên bản của ${target}.`,
          );
        } else {
          // Xóa theo index
          const targetIndex = parseInt(option) - 1;
          // Lọc ra những biên bản của riêng User đó để tìm đúng cái cần xóa
          const userBBs = allBB.filter((bb) => bb.userId === target.id);

          if (isNaN(targetIndex) || !userBBs[targetIndex]) {
            return message.reply(
              `${errorIcon} | Không tìm thấy biên bản số **${option}** của người này.`,
            );
          }

          // Tìm "vật thể" cụ thể đó trong mảng tổng allBB để xóa
          const itemToDelete = userBBs[targetIndex];
          const realIndex = allBB.indexOf(itemToDelete);

          allBB.splice(realIndex, 1);
          await setKey(bbKey, allBB);

          return message.reply(
            `${verifyIcon} | Đã xóa biên bản số **${option}** của ${target} (Trị giá: ${itemToDelete.money.toLocaleString()}).`,
          );
        }
      }
    } catch (error) {
      console.error(error);
      message.reply("Lỗi hệ thống.");
    }
  },
};
