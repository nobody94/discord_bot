const maxAmount = 10000;

const DEVELOPER_IDS = ['1446889473374683400']; 
const MAX_LOVE_POINTS_PER_DAY = 500;

function getCustomDate() {
    // Lấy thời gian hiện tại theo miliseconds
    const now = new Date();
    // Trừ đi 4 tiếng (4 * 60 * 60 * 1000 ms)
    const customDate = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    // Trả về định dạng YYYY-MM-DD (Ví dụ: 2024-05-20)
    // Lúc này, nếu là 3h sáng ngày 20, nó vẫn sẽ trả về ngày 19. 
    // Đúng 4h sáng ngày 20 mới bắt đầu trả về ngày 20.
    return customDate.toISOString().split('T')[0];
}

module.exports={
    maxAmount,
    DEVELOPER_IDS,
    getCustomDate,
    MAX_LOVE_POINTS_PER_DAY
}