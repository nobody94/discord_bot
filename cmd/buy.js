const { getBalance, removeMoney, getIcon,checkPay } = require("../utils/currency");
const { renderKey, setKey, getKey } = require("../utils/db");
const { SHOP_ITEMS } = require("../utils/shop");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

module.exports = {
  name: "buy",
  description: "Mua vật phẩm từ cửa hàng với số lượng.",

  async execute(message, args) {
    const userId = message.author.id;
    const itemId = args[0]?.toLowerCase();
    // Lấy số lượng từ args[1], mặc định là 1 nếu không nhập hoặc nhập sai
    const amount = parseInt(args[1]) || 1;

    // 1. Kiểm tra ID vật phẩm
    if (!itemId) {
      return message.reply(
        `${errorIcon} | Vui lòng nhập ID vật phẩm. Ví dụ: \`.buy gacha_box 5\``,
      );
    }

    if (amount <= 0) {
      return message.reply(`${errorIcon} | Số lượng mua phải lớn hơn 0!`);
    }

    // 2. Kiểm tra vật phẩm tồn tại
    const item = SHOP_ITEMS[itemId];
    if (!item || item.hideFromShop === true) {
      return message.reply(
        `${errorIcon} | Vật phẩm này không tồn tại hoặc không bán trực tiếp!`,
      );
    }

    // 3. Tính toán tổng tiền
    const totalPrice = item.price * amount;

    // 4. Kiểm tra số dư người dùng
    const userBalance = await getBalance(userId, item.currency);
    if (userBalance < totalPrice) {
      return message.reply(
        `💸 | Bạn cần **${totalPrice.toLocaleString()}** ${getIcon(item.currency)} để mua **${amount}x** ${item.icon} **${item.name}**.`,
      );
    }

    //kiểm tra nợ và biên bản
    const isBlocked = await checkPay(message, userId);
    if (isBlocked) return;


    try {
      // 5. Thực hiện trừ tiền
      const success = await removeMoney(userId, totalPrice, item.currency);

      if (success) {
        // 6. Thêm vật phẩm vào túi đồ (inventory)
        const invKey = renderKey("inventory", userId);

        // Tối ưu: Lấy mảng cũ, push hàng loạt rồi set 1 lần duy nhất để tránh spam DB
        const currentInv = (await getKey(invKey)) || [];
        for (let i = 0; i < amount; i++) {
          currentInv.push(itemId);
        }
        await setKey(invKey, currentInv);

        return message.reply({
          content: `${verifyIcon} | Chúc mừng! Bạn đã mua thành công **${amount}x** ${item.icon} **${item.name}** với tổng giá **${totalPrice.toLocaleString()}** ${getIcon(item.currency)}.\n📦 Gõ \`.balo\` để kiểm tra.`,
        });
      } else {
        return message.reply(
          `${errorIcon} | Giao dịch thất bại do lỗi hệ thống.`,
        );
      }
    } catch (error) {
      console.error("LỖI KHI MUA ĐỒ:", error);
      return message.reply(
        `${errorIcon} | Hệ thống gặp lỗi khi xử lý giao dịch.`,
      );
    }
  },
};
