const {renderKey,getKey,setKey} = require('./db');

async function checkHintLimit(newKey,userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = renderKey(newKey,userId);
    
    let data = await getKey(key);
    
    // Nếu chưa có dữ liệu hoặc sang ngày mới thì reset
    if (!data || data.lastUsed !== today) {
        data = { count: 0, lastUsed: today };
    }

    if (data.count >= 5) {
        return { canUse: false, remaining: 0 };
    }

    data.count++;
    await setKey(key, data);
    
    return { canUse: true, remaining: 5 - data.count };
}

module.exports={
    checkHintLimit
}