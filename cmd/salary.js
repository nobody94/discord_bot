const { addMoney, getIcon } = require("../utils/currency.js");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { DEVELOPER_IDS } = require("../utils/constant.js");

module.exports = {
  name: "salary",
  description: "Phát lương tuần cố định cho danh sách nhân sự.",

  async execute(message, args) {
    // 1. Kiểm tra quyền hạn
    const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
    if (!isDeveloper) {
      return message.reply(`${errorIcon} | Bạn không có quyền phát lương.`);
    }

    // Kiểm tra xem có tham số đầu vào không
    if (!args || args.length === 0) {
      return message.reply(
        `❌ Sai cú pháp! Sử dụng:\`.salary @role [số tiền] mora/primo\``,
      );
    }
    const subCommand = args[0].toLowerCase();
    let listToPay = [];

    // 2. XỬ LÝ LOGIC CHỌN ĐỐI TƯỢNG VÀ LOẠI TIỀN
    // Xử lý theo Role: .salary @role 100 primo
    const role = message.mentions.roles.first();
    const amount = parseInt(args[1]);
    const currencyType = args[2] ? args[2].toLowerCase() : "mora";

    if (!role) {
      return message.reply(
        `❌ Bạn cần tag một Role hoặc dùng từ khóa \`qtv\`.`,
      );
    }
    if (isNaN(amount) || amount <= 0) {
      return message.reply(`❌ Bạn chưa nhập số tiền hợp lệ.`);
    }

    // --- ĐOẠN SỬA ĐỔI: Sử dụng fetch để lấy đầy đủ thành viên ---
    const statusMsg = await message.channel.send(
      "🔄 Đang tải danh sách thành viên từ Role...",
    );

    try {
      // Fetch lại toàn bộ member của server để đảm bảo cache đầy đủ
      const allMembers = await message.guild.members.fetch();
      // Lọc ra những người có Role đó
      const roleMembers = allMembers.filter((m) => m.roles.cache.has(role.id));

      if (roleMembers.size === 0) {
        return statusMsg.edit(`❌ Role này hiện không có thành viên nào.`);
      }

      listToPay = roleMembers.map((m) => ({
        id: m.id,
        amount: amount,
        type: currencyType,
      }));
      await statusMsg.delete(); // Xóa tin nhắn chờ sau khi tải xong
    } catch (err) {
      console.error(err);
      return statusMsg.edit(`❌ Lỗi khi tải danh sách thành viên.`);
    }
    
    // 3. THỰC HIỆN PHÁT LƯƠNG
    let resultMessage = `## 💸 BẢNG LƯƠNG HỆ THỐNG 💸\n\n`;
    const statusMsg = await message.channel.send("🔄 Đang xử lý giao dịch...");

    for (const item of listToPay) {
      try {
        // Sử dụng addMoney với loại tiền động
        await addMoney(item.id, item.amount, item.type);
        resultMessage += `<@${item.id}>: **+${item.amount}** ${getIcon(item.type)}\n`;
      } catch (error) {
        console.error(`Lỗi phát lương cho ${item.id}:`, error);
        resultMessage += `❌ Lỗi khi phát cho <@${item.id}>.\n`;
      }
    }

    // 4. CẬP NHẬT KẾT QUẢ CUỐI CÙNG
    return statusMsg.edit(resultMessage);
  },
};
