const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Cấu hình các loại tiền
const CURRENCIES = {
  mora: { icon: "<:mora:1450698996170363063>", key: "mora" },
  primo: { icon: "<:primogem:1451037556635336776>", key: "primo" }, 
};

const DEFAULT_TYPE = 'mora';
const dbKey="nobody_bot"

// Hàm lấy Icon theo loại tiền
function getIcon(type = DEFAULT_TYPE) {
    return CURRENCIES[type]?.icon || CURRENCIES[DEFAULT_TYPE].icon;
}

async function getAllBalances(userId) {
    const balances = {};
    
    // Chạy vòng lặp qua danh sách các loại tiền đã định nghĩa
    for (const [type, config] of Object.entries(CURRENCIES)) {
        const key = `${dbKey}_${config.key}_${userId}`;
        const rawValue = await db.get(key);
        balances[type] = Number(rawValue) || 0;
    }
    
    return balances;
}

// Lấy số dư theo loại tiền
async function getBalance(userId, type = DEFAULT_TYPE) {
    const key = `${dbKey}_${CURRENCIES[type]?.key || DEFAULT_TYPE}_${userId}`;
    const rawBalance = await db.get(key);
    return Number(rawBalance) || 0;
}

// Cộng tiền theo loại tiền
async function addMoney(userId, amount, type = DEFAULT_TYPE) {
    try {
        const key = `${dbKey}_${CURRENCIES[type]?.key || DEFAULT_TYPE}_${userId}`;
        await db.add(key, amount);
        return true;
    } catch (error) {
        console.error("LỖI CỘNG TIỀN:", error);
        return false;
    }
}

// Trừ tiền theo loại tiền
async function removeMoney(userId, amount, type = DEFAULT_TYPE) {
    if (typeof amount !== "number" || amount <= 0) return false;
    const current = await getBalance(userId, type);
    if (amount > current) return false;

    const key = `${dbKey}_${CURRENCIES[type]?.key || DEFAULT_TYPE}_${userId}`;
    await db.set(key, current - amount);
    return true;
}

async function checkHintLimit(newKey,userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${dbKey}_${newKey}_${userId}`;
    
    let data = await db.get(key);
    
    // Nếu chưa có dữ liệu hoặc sang ngày mới thì reset
    if (!data || data.lastUsed !== today) {
        data = { count: 0, lastUsed: today };
    }

    if (data.count >= 5) {
        return { canUse: false, remaining: 0 };
    }

    data.count++;
    await db.set(key, data);
    
    return { canUse: true, remaining: 5 - data.count };
}

module.exports = { getAllBalances,getBalance, addMoney, removeMoney, getIcon, CURRENCIES,db,checkHintLimit,dbKey };