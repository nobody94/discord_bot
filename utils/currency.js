const {renderKey,getKey,setKey,addKey} = require('./db');

// Cấu hình các loại tiền
const CURRENCIES = {
  mora: { icon: "<:mora:1450698996170363063>", key: "mora" },
  primo: { icon: "<:primogem:1451037556635336776>", key: "primo" }, 
};

const DEFAULT_TYPE = 'mora';

// Hàm lấy Icon theo loại tiền
function getIcon(type = DEFAULT_TYPE) {
    return CURRENCIES[type]?.icon || CURRENCIES[DEFAULT_TYPE].icon;
}

async function getAllBalances(userId) {
    const balances = {};
    
    // Chạy vòng lặp qua danh sách các loại tiền đã định nghĩa
    for (const [type, config] of Object.entries(CURRENCIES)) {
        const key = renderKey(config.key,userId);
        const rawValue = await getKey(key);    
        balances[type] = Number(rawValue) || 0;
    }
    
    return balances;
}

// Lấy số dư theo loại tiền
async function getBalance(userId, type = DEFAULT_TYPE) {
    const key = renderKey(CURRENCIES[type]?.key || DEFAULT_TYPE,userId);
    const rawBalance = await getKey(key);
    return Number(rawBalance) || 0;
}

// Cộng tiền theo loại tiền
async function addMoney(userId, amount, type = DEFAULT_TYPE) {
    try {
        const key = renderKey(CURRENCIES[type]?.key || DEFAULT_TYPE,userId);
        await addKey(key, amount);
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

    const key = renderKey(CURRENCIES[type]?.key || DEFAULT_TYPE,userId);
    await setKey(key, current - amount);
    return true;
}



module.exports = { getAllBalances,getBalance, addMoney, removeMoney, getIcon,CURRENCIES };