const { QuickDB } = require("quick.db");
const db = new QuickDB();

const currencyIcon = "<:nMoney:1450423722828894289>";
const currencyKey = "nobody_bot_mora";

// Hàm: Lấy số tiền hiện tại của người dùng.
async function getBalance(userId) {
     const key = `${currencyKey}_${userId}`;
    const rawBalance = await db.get(key);

    // Ép kiểu: chuyển rawBalance sang Number. Nếu nó là null/undefined/string rỗng,
    // thì Number() sẽ ra 0. Nếu nó là chuỗi "100", sẽ ra 100.
    const balance = Number(rawBalance) || 0;

    return balance; 
}

// Hàm: Cộng thêm một lượng tiền vào số dư.
async function addMoney(userId, amount) {
  // db.add(key, value) sẽ tự động cộng giá trị vào số hiện tại.
  // Nếu key chưa có, nó sẽ tạo và đặt giá trị là amount.
  try {
    await db.add(`${currencyKey}_${userId}`, amount);
    return true;
  } catch (error) {
    console.error("LỖI KHI CẬP NHẬT SỐ DƯ:", error);
    return false;
  }
}

// Hàm: Trừ một lượng tiền hoặc đặt lại số tiền.
async function removeMoney(userId, amount) {
  // db.sub(key, value) sẽ trừ giá trị khỏi số hiện tại.
  if (typeof amount !== "number" || amount <= 0) return false;

  const currentBalance = await getBalance(userId);

  if (amount > currentBalance) {
    return false; // Bot đang trả về false tại đây!
  }

  const newBalance = currentBalance - amount;
  await db.set(`${currencyKey}_${userId}`, newBalance);

  return true;
  // await db.sub(`money_${userId}`, amount);
}

module.exports = {
  getBalance,
  addMoney,
  removeMoney,
  db,
  currencyIcon,
};
