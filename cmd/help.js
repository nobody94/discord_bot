const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");

module.exports = {
  name: "help",
  aliases: ["trogiup"],
  description: "Danh sách các lệnh của Bot với menu chọn lọc",

  async execute(message, args) {
    // 1. Định nghĩa các danh mục và lệnh tương ứng
    const categories = {
      games: {
        label: "Trò chơi (Games)",
        emoji: "🎮",
        color: "#FF5733", // Màu cam đỏ (Action/Combat)
        commands:
          "• slots, slot, sl: Máy đánh bạc\n• taixiu, tx: Chơi tài xỉu\n• baucua, bc: Chơi bầu cua \n• caoveso, scratch,sc: cào vé số\n• hint, wc, ws: Dùng để search từ trong kênh nối từ Tiếng Việt/Tiếng Anh(Mỗi ngày được 5 lượt)\n• restart: restart game kênh nối từ\n• fishshop, fs: cửa hàng bán đồ câu cá\n• tuica, inv: xem đồ nghề câu cá\n• cauca, fish, cc: câu cá\n• beca, tank: xem bể cá\n• suacan, repair: sửa cần câu",
      },
      currency: {
        label: "Tiền tệ & Cửa hàng",
        emoji: "💵",
        color: "#FFD700", // Màu vàng Mora
        commands:
          "• balance, money: Kiểm tra số dư\n• daily, claim: Nhận thưởng hàng ngày\n• exchange, doitien: Đổi tiền\n• shop, buy: Xem và mua đồ",
      },
      inventory: {
        label: "Túi đồ (Inventory)",
        emoji: "🎒",
        color: "#3498db", // Màu xanh dương thông tin
        commands:
          "• balo: Xem túi đồ\n• balo give: Tặng vật phẩm\n• balo sell: Bán vật phẩm\n• balo open: Mở vật phẩm",
      },
      interaction: {
        label: "Tương tác",
        emoji: "📘",
        color: "#FFB6C1", 
        commands:
          "• Hạnh phúc: kiss, hug, cuddle, cheek, airkiss, lick, nibled\n• Vui vẻ: laugh, highfive, pat, stare, pinch\n• Mạnh bạo: slap, poke, punch, kick, fight, bonk, rip,spank",
      },
      interaction: {
        label: "Cặp đôi",
        emoji: "❤️",
        color: "#FF69B4", 
        commands:
          "• marry, kethon: Dùng để cầu hôn\n• divorce, lyhon: Dùng để ly hôn\n• couple, cp: Xem tình trạng hôn nhân\n• marrylist, mrl: Danh sách các cặp đôi",
      },
      admin: {
        label: "Cấu hình (Admin)",
        emoji: "⚙️",
        color: "#95a5a6", // Màu xám hệ thống
        commands:
          "• setwordchain vi/en: Cài đặt nối chữ\n• setwordle: Cài đặt Vua Tiếng Việt",
      },
      anniversary: {
        label: "Anniversary (Admin)",
        emoji: "🎂",
        color: "#d4558a",
        commands:
          "• setbirthday, setsinhnhat: lưu sinh nhật của user\n• checkbirthday, xemsinhnhat, birthdaylist: xem danh sách sinh nhật trong tháng hoặc của user\n• hpbd, sinhnhat: gửi lời chúc sinh nhật\n• lixi, phatloc: lì xì cho toàn bộ thành viên trong server",
      },
    };

    // 2. Tạo Embed mặc định ban đầu
    const mainEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📚 Trung Tâm Trợ Giúp")
      .setDescription(
        "Vui lòng chọn một danh mục từ **Menu bên dưới** để xem chi tiết các lệnh."
      )
      .setFooter({ text: "Sử dụng dấu chấm (.) trước mỗi lệnh." });

    // 3. Tạo Select Menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Chọn danh mục lệnh tại đây...")
      .addOptions(
        Object.keys(categories).map((key) => ({
          label: categories[key].label,
          value: key,
          emoji: categories[key].emoji,
          description: `Xem các lệnh về ${categories[key].label}`,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // 4. Gửi tin nhắn và bắt đầu lắng nghe tương tác
    const response = await message.reply({
      embeds: [mainEmbed],
      components: [row],
    });

    // Tạo bộ lọc: Chỉ người gọi lệnh mới có thể nhấn menu
    const filter = (i) => i.user.id === message.author.id;
    const collector = response.createMessageComponentCollector({
      filter,
      componentType: ComponentType.StringSelect,
      time: 60000, // Menu tồn tại trong 60 giây
    });

    collector.on("collect", async (interaction) => {
      const selected = interaction.values[0];
      const category = categories[selected];

      const updatedEmbed = new EmbedBuilder()
        .setColor(category.color)
        .setTitle(`${category.emoji} Danh mục: ${category.label}`)
        .setDescription(category.commands)
        .setFooter({ text: "Dùng (.) trước lệnh • Hết hạn sau 60s" });

      await interaction.update({ embeds: [updatedEmbed] });
    });

    collector.on("end", () => {
      // Vô hiệu hóa menu khi hết thời gian
      const disabledRow = new ActionRowBuilder().addComponents(
        selectMenu.setDisabled(true).setPlaceholder("Menu đã hết hạn.")
      );
      response.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
