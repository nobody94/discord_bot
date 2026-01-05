const maxAmount = 10000;

const DEVELOPER_IDS = ['1446889473374683400']; 
const MAX_LOVE_POINTS_PER_DAY = 500;

function getCustomDate() {
   const vnTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    // 2. Trừ đi 4 tiếng để tạo mốc reset là 4h sáng
    // Nếu bây giờ là 3h sáng ngày 20 -> lùi 4h sẽ thành 23h ngày 19 (Chính xác)
    vnTime.setHours(vnTime.getHours() - 4);
    
    // 3. Lấy định dạng YYYY-MM-DD
    const year = vnTime.getFullYear();
    const month = String(vnTime.getMonth() + 1).padStart(2, '0');
    const day = String(vnTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

module.exports={
    maxAmount,
    DEVELOPER_IDS,
    getCustomDate,
    MAX_LOVE_POINTS_PER_DAY
}