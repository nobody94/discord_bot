const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Hàm: Lấy số tiền hiện tại của người dùng.
async function getBalance(userId) {
    // db.get(key) sẽ trả về giá trị được lưu trữ.
    // Nếu không có, ta mặc định là 0.
    return await db.get(`money_${userId}`) || 0; 
}

// Hàm: Cộng thêm một lượng tiền vào số dư.
async function addMoney(userId, amount) {
    // db.add(key, value) sẽ tự động cộng giá trị vào số hiện tại.
    // Nếu key chưa có, nó sẽ tạo và đặt giá trị là amount.
    await db.add(`money_${userId}`, amount);
}

// Hàm: Trừ một lượng tiền hoặc đặt lại số tiền.
async function removeMoney(userId, amount) {
    // db.sub(key, value) sẽ trừ giá trị khỏi số hiện tại.
    await db.sub(`money_${userId}`, amount);
}

const currency = 'xu'

module.exports = {
    getBalance,
    addMoney,
    removeMoney,
    db,
    currency
};