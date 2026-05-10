const cooldowns = new Map(); 

module.exports = {
    checkCooldown: (userId, commandName, seconds) => {
        const key = `${userId}-${commandName}`;
        
        // Nếu key đã tồn tại trong Map, nghĩa là đang bị cooldown
        if (cooldowns.has(key)){ 
            return true; 
        }

        // Nếu chưa có, tạo mới và lưu thời gian hiện tại
        cooldowns.set(key, Date.now());

        // Thiết lập tự động xóa sau X giây
        setTimeout(() => {
            cooldowns.delete(key);
        }, seconds * 1000);

        return false;
    },

    // Hàm lấy số giây còn lại để báo cho người dùng
    getRemaining: (userId, commandName, seconds) => {
        const key = `${userId}-${commandName}`;
        if (!cooldowns.has(key)) return 0;
        
        const startTime = cooldowns.get(key);
        const timeLeft = (startTime + (seconds * 1000) - Date.now()) / 1000;
        return timeLeft > 0 ? timeLeft.toFixed(1) : 0;
    },

    getCountdown:(userId, commandName, seconds) =>{
        const remaining = module.exports.getRemaining(userId, commandName, seconds);
        if (remaining <= 0) return null;        
        
        const expireTime = Math.floor((Date.now() / 1000) + parseFloat(remaining));
        
        return `<t:${expireTime}:R>`;
    }
};