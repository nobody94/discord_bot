const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey } = require("../utils/db");
const { bagIcon } = require("../utils/icon.js"); // Sử dụng icon túi đồ từ file icon

module.exports = {
  name: "tuido",
  aliases: ["bag"],
  description: "Xem các vật phẩm trò chơi bạn đang sở hữu.",

  async execute(message, args) {
    // Xác định xem người dùng muốn xem loại đồ nào (mặc định là exchange)
    const isGiftView = args[0] && args[0].toLowerCase() === 'gift';
    const filterType = isGiftView ? 'gift' : 'exchange';  
    
    const shopKey = renderKey('taphoa');
    const allData = (await getKey(shopKey)) || {};   

    // Xác định đối tượng cần kiểm tra (người dùng được tag có thể nằm ở args[0] hoặc args[1] tùy theo lệnh)
    // Nếu dùng .tuido gift @user thì target là args[1], nếu .tuido @user thì target là args[0]
    const targetUser = message.mentions.users.first() || message.author;
    const userId = targetUser.id;
    const username = targetUser.username;

    // Truy xuất dữ liệu từ key game_inventory
    const invKey = renderKey("game_inventory", userId);
    const inventory = (await getKey(invKey)) || [];

    const embed = new EmbedBuilder()
      .setTitle(`${bagIcon} ${isGiftView ? 'KHO VẬT PHẨM TẶNG' : 'TÚI ĐỒ TRÒ CHƠI'}: ${username.toUpperCase()}`)
      .setColor(isGiftView ? 0xFF69B4 : 0x2ecc71) // Màu hồng cho gift, xanh cho exchange
      .setTimestamp();

    if (inventory.length === 0) {
      embed.setDescription(`*Bạn không sở hữu vật phẩm nào trong ${isGiftView ? 'kho vật phẩm tặng' : 'túi đồ'}.*`);
    } else {
      // Đếm số lượng từng loại vật phẩm
      const counts = {};
      inventory.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      // Lọc và chuyển đổi ID thành tên vật phẩm dựa trên allData và loại yêu cầu
      const itemList = Object.entries(counts)
        .filter(([id, count]) => {
            const item = allData[id];
            return item && item.type === filterType; // Chỉ hiện loại đang yêu cầu
        })
        .map(([id, count]) => {
          const item = allData[id];
          return `**${item.name}** x${count} (ID: \`${id}\`)\n*${item.description}*`;
        })
        .join("\n");

      if (!itemList) {
        embed.setDescription(`*Bạn không có vật phẩm loại ${isGiftView ? 'gift' : 'exchange'} nào.*`);
      } else {
        embed.setDescription(itemList);
      }
    }

    message.reply({ embeds: [embed] });
  },
};