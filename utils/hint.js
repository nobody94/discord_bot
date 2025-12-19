const {renderKey,getKey,setKey} = require('./db');

async function checkHintLimit(newKey,userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = renderKey(newKey,'hint');
    
    let data = await getKey(key);
    
    // Nếu chưa có dữ liệu hoặc sang ngày mới thì reset
    if (!data || data.hints?.length == 0) {
        data = { 
            hints:[
                {
                    userId,
                    count: 0, 
                    lastUsed: today
                }
            ]
        };
    }

    const userData = data.hints.find((d)=> d.userId == userId);

    if (userData.count >= 5) {
        return { canUse: false, remaining: 0 };
    }

    data = {
        hints: data.hints.map((d)=> d.userId == userId ? {...d,count: d.count + 1} :d)
    };
    await setKey(key, data);
    
    return { canUse: true, remaining: 5 - userData.count };
}

module.exports={
    checkHintLimit
}