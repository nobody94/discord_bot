const { renderKey, getKey, setKey } = require("./db");

async function handleTransaction(senderId, receiverId, type, content) {
    try {
        // Lấy thời gian hiện tại (Múi giờ Việt Nam)
        const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

        // 1. Tạo cấu trúc log
        const logEntry = {
            time: timestamp,
            type: type,
            senderId: senderId,
            receiverId: receiverId,
            details: content
        };

        // 2. Lấy danh sách log cũ từ Key duy nh
        let allLogs = (await getKey("transaction_logs")) || [];

        // 3. Thêm log mới vào đầu mảng (unshift) để khi check sẽ thấy cái mới nhất trước
        allLogs.unshift(logEntry);

        // 4. Giới hạn số lượng log để DB không bị quá nặng (Ví dụ: 1000 bản ghi)
        // Với server 300 người, 1000-2000 bản ghi là cực kỳ an toàn.
        if (allLogs.length > 1000) {
            allLogs = allLogs.slice(0, 1000);
        }

        // 5. Lưu lại vào Database
        await setKey("transaction_logs", allLogs);

        return true;
    } catch (err) {
        console.error("[Logger Error]: Không thể ghi log giao dịch.", err);
        return false;
    }
}

module.exports = { handleTransaction };