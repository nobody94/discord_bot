const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getBalance, removeMoney, getIcon } = require("../utils/currency.js");
const { renderKey, setKey, getKey } = require('../utils/db');
const { SHOP_ITEMS } = require("../utils/shop.js");

module.exports = {
  name: "marry",
  aliases: ["kethon"],
  async execute(message, args) {
    const target = message.mentions.members.first();
    
    // Lấy thông tin nhẫn cưới từ SHOP_ITEMS
    const itemKey = 'nhan_cuoi';
    const ringItem = SHOP_ITEMS[itemKey]; 
    const RING_PRICE = ringItem.price; 

    if (!target || target.id === message.author.id || target.user.bot) {
      return message.reply("❌ Bạn cần tag một người dùng thật để cầu hôn!");
    }

    // --- BẮT ĐẦU CHECK TÌNH TRẠNG HÔN NHÂN ---
    const coupleKey = renderKey('couple', message.guild.id);
    const couplesList = (await getKey(coupleKey)) || [];

    // Kiểm tra xem người cầu hôn đã kết hôn chưa
    const isAuthorMarried = couplesList.find(c => c.husband === message.author.id || c.wife === message.author.id);
    if (isAuthorMarried) {
      return message.reply("❌ Bạn đã kết hôn rồi! Muốn cưới người mới thì phải ly hôn trước đã.");
    }

    // Kiểm tra xem người được cầu hôn đã kết hôn chưa
    const isTargetMarried = couplesList.find(c => c.husband === target.id || c.wife === target.id);
    if (isTargetMarried) {
      return message.reply(`❌ <@${target.id}> đã là "hoa có chủ" rồi, bạn không thể cầu hôn người này!`);
    }
    // --- KẾT THÚC CHECK TÌNH TRẠNG HÔN NHÂN ---

    // Kiểm tra tiền của người cầu hôn
    const balance = await getBalance(message.author.id, "mora");
    if (balance < RING_PRICE) {
      return message.reply(`❌ Bạn cần ít nhất **${RING_PRICE.toLocaleString()}** ${getIcon("mora")} để mua ${ringItem.icon} **${ringItem.name}**!`);
    }

    const embed = new EmbedBuilder()
      .setTitle("💍 LỜI CẦU HÔN LÃNG MẠN")
      .setColor("#ff69b4")
      .setDescription(`<@${message.author.id}> đang dùng ${ringItem.icon} **${ringItem.name}** để cầu hôn <@${target.id}>!\n\n*"Bạn có đồng ý cùng mình đi hết đoạn đường này không?"*`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("accept_marry").setLabel("Đồng Ý").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("reject_marry").setLabel("Từ Chối").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ content: `<@${target.id}> ơi!`, embeds: [embed], components: [row] });
    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== target.id) {
        return i.reply({ content: "Đừng có phá đám cưới người ta chứ!", ephemeral: true });
      }

      // Luôn trừ tiền mua nhẫn ngay khi bắt đầu thủ tục (coi như đã mua nhẫn từ shop)
      await removeMoney(message.author.id, RING_PRICE, "mora");

      if (i.customId === "accept_marry") {
        // TRƯỜNG HỢP ĐỒNG Ý: Tặng nhẫn cho đối phương
        // Logic: Lưu quan hệ kết hôn vào Database và chuyển item 'nhan_cuoi' cho target (nếu bot có hệ thống inventory)        
        const invKey = renderKey('inventory', target.id);
        const currentInv = (await getKey(invKey)) || [];
        currentInv.push(itemKey);
        await setKey(invKey, currentInv);

        // 2. Cập nhật danh sách cặp đôi TRONG SERVER     
        couplesList.push({
          husband: message.author.id,
          wife: target.id,
          date: Date.now()
        });
        
        await setKey(coupleKey, couplesList);

        await i.update({ 
            content: `🎉 **CHÚC MỪNG!** <@${message.author.id}> đã trao ${ringItem.icon} cho <@${target.id}>. Hai bạn đã chính thức kết hôn!`, 
            embeds: [], 
            components: [] 
        });
      } else {
        // TRƯỜNG HỢP TỪ CHỐI: Giữ nhẫn trong balo (Inventory)
        // Logic: Thêm vật phẩm nhẫn cưới vào kho đồ của người cầu hôn vì tiền đã bị trừ
        const invKey = renderKey('inventory', message.author.id);
        const currentInv = (await getKey(invKey)) || [];
        currentInv.push(itemKey);
        await setKey(invKey, currentInv);

        await i.update({ 
            content: `💔 <@${target.id}> đã từ chối. <@${message.author.id}> lủi thủi cất ${ringItem.icon} **${ringItem.name}** lại vào balo...`, 
            embeds: [], 
            components: [] 
        });
      }
      collector.stop();
    });
  }
};