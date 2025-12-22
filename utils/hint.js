const { renderKey, getKey, setKey } = require('./db');

async function checkHintLimit(newKey, userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = renderKey(newKey, 'hint');
    
    let data = await getKey(key);
    
    // 1. Khởi tạo cấu trúc dữ liệu nếu chưa tồn tại
    if (!data || !data.hints) {
        data = { hints: [] };
    }

    // 2. Tìm dữ liệu của người dùng cụ thể
    let userIndex = data.hints.findIndex((d) => d.userId === userId);
    let userData = data.hints[userIndex];

    // 3. Kiểm tra reset theo ngày: Nếu chưa có data hoặc ngày cuối dùng khác hôm nay
    if (!userData || userData.lastUsed !== today) {
        const newUserData = {
            userId,
            count: 0,
            lastUsed: today
        };

        if (userIndex === -1) {
            data.hints.push(newUserData);
        } else {
            data.hints[userIndex] = newUserData;
        }
        
        userData = newUserData;
    }

    // 4. Kiểm tra giới hạn 5 lượt
    const MAX_HINTS = 5;
    if (userData.count >= MAX_HINTS) {
        return { 
            canUse: false, 
            remaining: 0, 
            count: userData.count 
        };
    }

    // 5. Tăng số lượt dùng và lưu lại vào DB
    userData.count += 1;
    data.hints = data.hints.map((d) => d.userId === userId ? userData : d);
    
    await setKey(key, data);
    
    return { 
        canUse: true, 
        remaining: MAX_HINTS - userData.count,
        count: userData.count
    };
}

module.exports = {
    checkHintLimit
};