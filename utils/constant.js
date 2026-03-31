//max tiền được đánh cược
const maxAmount = 10000;

const DEVELOPER_IDS = ['1446889473374683400','1016709206780411924']; 
const MAX_LOVE_POINTS_PER_DAY = 500; 
const managerIds = ['1182987381662556253', "1446889473374683400"];
const giftManagerIds = ['1016709206780411924', "1446889473374683400"];
//số tiền đổi từ primo ra mora
const exchangeRate = 10000;

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

function calculateInterest(date) {
    const startDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    let interestRate = 0;
    if (diffDays >= 7) interestRate = 0.10;      // >= 7 ngày lãi 10%
    else if (diffDays >= 3) interestRate = 0.05; // >= 3 ngày lãi 5%
    else interestRate = 0.02;                    // < 3 ngày lãi 2%

    return {
        rate: interestRate,
        days: diffDays
    };
}

module.exports={
    maxAmount,
    DEVELOPER_IDS,
    getCustomDate,
    MAX_LOVE_POINTS_PER_DAY,
    managerIds,
    giftManagerIds,
    calculateInterest,
    exchangeRate
}