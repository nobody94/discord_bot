const fs = require('fs');
// Import db và deleteKey từ file cấu hình của bạn
const { db, deleteKey,renderKey,getKey,setKey } = require("./utils/db");

async function startDeepClean() {
    console.log("⏳ Đang kết nối tới MongoDB Atlas...");
    const guildId = "1446876484986736833";

    // BƯỚC QUAN TRỌNG: Đợi Database kết nối thành công
    try {
        await db.connect();
        console.log("✅ Kết nối Database thành công!");
    } catch (err) {
        console.error("❌ Không thể kết nối Database:", err.message);
        process.exit(1);
    }

    // 1. Đọc file JSON bạn đã export từ Compass
    if (!fs.existsSync('./test.jsons.json')) {
        console.log("❌ Không tìm thấy file test.jsons.json trong thư mục!");
        process.exit(1);
    }

    const rawData = fs.readFileSync('./test.jsons.json');
    const allDocs = JSON.parse(rawData);

    // 2. Tìm danh sách "người sống" (all_users)
    const allUsersDoc = allDocs.find(doc => doc.ID === "all_users");
    if (!allUsersDoc) {
        console.log("❌ Không tìm thấy key 'all_users' trong file JSON.");
        console.log("👉 Hãy chạy lệnh .cleanup build trên Discord rồi Export lại file mới.");
        process.exit(1);
    }

    const safeIds = new Set(allUsersDoc.data);
    console.log(`🔍 Đang đối chiếu ${allDocs.length} bản ghi với ${safeIds.size} người dùng an toàn...`);

    let trashCount = 0;
    const userDataTypes = ["inventory", "fishtank", "fish_inv", "daily", "rpg_user","mora",'primo','trunk'];
    // const guildKey = ['birthday','couple','bienban'];    

    // 3. Duyệt và xóa rác trực tiếp trên Atlas
    for (const doc of allDocs) {
        const key = doc.ID;
        if (!key || typeof key !== 'string') continue;

        const isUserDataType = userDataTypes.some(type => key.includes(`nobody_bot_${type}_`));

        if (isUserDataType) {
            const userId = key.split('_').pop();

            // Nếu ID không nằm trong danh sách 208 người đang ở server
            if (!safeIds.has(userId)) {
                try {
                    process.stdout.write(`🗑️  Đang xóa: ${key}... `);
                    await deleteKey(key); // Xóa theo ID cụ thể (Không lỗi $where)
                    console.log("Xong!");
                    trashCount++;
                } catch (e) {
                    console.log(`Lỗi: ${e.message}`);
                }
            }
        }

        // const isGuildData = guildKey.some(type => key.includes(`nobody_bot_${type}_${guildId}`));
        
        // if(isGuildData){
        //     try {
        //         process.stdout.write(`🗑️  Đang xóa: ${key}... `);
        //         await deleteKey(key); 
        //         console.log("Xong!");
        //     } catch (e) {
        //         console.log(`Lỗi: ${e.message}`);
        //     }
        // }

        const userId = key.split('_').pop();
        if (!safeIds.has(userId)) {
            //couple
            const coupleKey = renderKey('couple', guildId);
            const couplesList = (await getKey(coupleKey)) || [];
            const coupleInfo = couplesList.find(c => c.husband === userId || c.wife === userId);
            if (coupleInfo) {
                // 1. Lọc bỏ cặp đôi này khỏi danh sách
                const updatedCouplesList = couplesList.filter(c =>
                    c.husband !== userId && c.wife !== userId
                );

                // 2. Lưu danh sách đã cập nhật lại vào DB
                await setKey(coupleKey, updatedCouplesList);
                console.log(`Đã xóa thông tin kết hôn của user ${userId}`);
            }

            //bienban
            const bbKey = renderKey("bienban", guildId);
            const bienban = (await getKey(bbKey)) || [];
            const userbb = bienban.find(c => c.userId === userId);

            if (userbb) {
                const updatebb = bienban.filter(c =>
                    c.userId === userId
                );

                await setKey(bbKey, updatebb);
                console.log(`Đã xóa thông tin bb của user ${userId}`);
            }

            //sn
            const snKey = `birthday_${guildId}`;
            const snData = (await getKey(snKey)) || {};
            if (snData[userId]) {
                const filterData = Object.fromEntries(Object.entries(snData).filter(([key, value]) => key !== userId));
                await setKey(snKey, filterData);
                console.log(`Đã xóa thông tin sn của user ${userId}`);
            }
        }
    }

    console.log(`\n✨ TỔNG KẾT: Đã dọn sạch ${trashCount} bản ghi rác cũ.`);
    console.log("🚀 Database của bạn hiện tại đã cực kỳ sạch sẽ!");
    process.exit(0);
}

startDeepClean();