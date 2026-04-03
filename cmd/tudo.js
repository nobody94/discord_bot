const { EmbedBuilder } = require("discord.js");
const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon } = require("../utils/currency.js");
const { SHOP_ITEMS } = require("../utils/shop");
const { errorIcon, verifyIcon, bagIcon } = require("../utils/icon.js");

module.exports = {
  name: "tudo",
  description: "Xem tủ đồ cá nhân và lấy đồ ra ba lô.",

  async execute(message, args) {
    // --- CẤU HÌNH GIỚI HẠN ---
    const allowedChannels = ["1447195483637420165"]; 
    const allowedUsers = ["1446889473374683400","1016709206780411924", "1308643245018054716","1302095613609115689"]; 

    if (!allowedChannels.includes(message.channel.id)) return;
    if (!allowedUsers.includes(message.author.id)) return;

    // Luôn xác định người thực hiện lệnh là author
    const senderId = message.author.id;
    const senderTudoKey = renderKey("tudo", senderId);
    let senderTudo = (await getKey(senderTudoKey)) || [];

    // --- LOGIC LẤY ĐỒ RA BAO LÔ (LAY/TAKE) ---
    if (args[0] === "lay" || args[0] === "take") {
        const itemId = args[1];
        const amountToTake = parseInt(args[2]) || 1;

        if (!itemId) 
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm: \`.tudo lay [ID] [số lượng]\``);
        
        if (isNaN(amountToTake) || amountToTake <= 0)
            return message.reply(`${errorIcon} | Số lượng lấy ra không hợp lệ.`);

        const itemInTudo = senderTudo.filter((id) => id === itemId);
        if (itemInTudo.length < amountToTake) {
            return message.reply(`${errorIcon} | Bạn không đủ **${itemId}** trong tủ đồ (Hiện có: ${itemInTudo.length}).`);
        }

        const baloKey = renderKey("inventory", senderId);
        let baloInventory = (await getKey(baloKey)) || [];

        for (let i = 0; i < amountToTake; i++) {
            const index = senderTudo.indexOf(itemId);
            if (index !== -1) {
                senderTudo.splice(index, 1);
                baloInventory.push(itemId);
            }
        }

        await setKey(senderTudoKey, senderTudo);
        await setKey(baloKey, baloInventory);

        const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
        return message.reply(
            `${verifyIcon} | Bạn đã lấy **${amountToTake}x ${itemInfo.icon} ${itemInfo.name}** từ Tủ đồ vào Bao lô thành công!`
        );
    }

    // --- LOGIC TẶNG ĐỒ (GIVE) ---
    if (args[0] === "give") {
        const target = message.mentions.users.first();
        const itemId = args[2];
        const amountToGive = parseInt(args[3]) || 1;

        if (!target)
            return message.reply(`${errorIcon} | Vui lòng tag người muốn tặng: \`.tudo give @user [ID] [số lượng]\``);
        if (target.id === senderId)
            return message.reply(`${errorIcon} | Bạn không thể tự tặng đồ cho chính mình.`);
        if (!itemId)
            return message.reply(`${errorIcon} | Vui lòng nhập ID vật phẩm muốn tặng.`);
        if (isNaN(amountToGive) || amountToGive <= 0)
            return message.reply(`${errorIcon} | Số lượng tặng không hợp lệ.`);

        const userItems = senderTudo.filter((id) => id === itemId);
        if (userItems.length < amountToGive) {
            return message.reply(`${errorIcon} | Bạn không đủ số lượng **${itemId}** để tặng (Hiện có: ${userItems.length}).`);
        }

        // Logic xử lý quà tặng không thể trao đổi
        // Lưu ý: Kiểm tra ID vật phẩm tại đây nếu bạn muốn áp dụng quy tắc quà tặng Pokémon không thể bán/trao đổi.
       
        const targetInvKey = renderKey("tudo", target.id);
        let targetInventory = (await getKey(targetInvKey)) || [];

        for (let i = 0; i < amountToGive; i++) {
            const index = senderTudo.indexOf(itemId);
            if (index !== -1) {
                senderTudo.splice(index, 1);
                targetInventory.push(itemId);
            }
        }

        await setKey(senderTudoKey, senderTudo);
        await setKey(targetInvKey, targetInventory);    

        const itemInfo = SHOP_ITEMS[itemId] || { name: itemId, icon: "📦" };
        return message.reply(
            `${verifyIcon} | Bạn đã tặng **${amountToGive}x ${itemInfo.icon} ${itemInfo.name}** cho **${target.username}** thành công!`
        );
    }

    // --- HIỂN THỊ TỦ ĐỒ ---
    // Nếu không có args (chỉ gõ .tudo) hoặc .tudo @user để xem tủ đồ người khác
    const viewTarget = message.mentions.users.first() || message.author;
    const viewKey = renderKey("tudo", viewTarget.id);
    const viewInventory = (viewTarget.id === senderId) ? senderTudo : (await getKey(viewKey)) || [];

    const embed = new EmbedBuilder()
      .setTitle(`${bagIcon} TỦ ĐỒ ĐẶC BIỆT CỦA ${viewTarget.username.toUpperCase()}`)
      .setColor(0xe74c3c)
      .setFooter({
        text: "Lệnh: .tudo lay <ID> <SL> | .tudo give @user <ID> <SL>",
      });

    if (viewInventory.length === 0) {
      embed.setDescription("*Tủ đồ đang trống rỗng...*");
    } else {
      const counts = {};
      viewInventory.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      const itemList = Object.entries(counts)
        .map(([id, count],index) => {
          const item = SHOP_ITEMS[id];
          return item ? `**${index + 1}.** ${item.icon} **${item.name}** x${count} (ID: \`${id}\`)` : `❓ Vật phẩm lạ x${count} (ID: ${id})`;
        })
        .join("\n");

      embed.setDescription(itemList);
    }

    message.reply({ embeds: [embed] });
  },
};