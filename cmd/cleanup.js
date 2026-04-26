const { DEVELOPER_IDS } = require("../utils/constant.js");
const { renderKey, setKey, getKey, deleteKey } = require("../utils/db");

module.exports = {
  name: "cleanup",
  description: "Dọn dẹp dữ liệu an toàn",

  async execute(message, args) {
    if (!DEVELOPER_IDS.includes(message.author.id)) return;

    const mode = args[0];
    const guildId = message.guild.id;

    // --- CHẾ ĐỘ 1: BUILD (BẮT BUỘC CHẠY TRƯỚC) ---
    // Bot sẽ lấy 300+ người đang ở server hiện tại làm "Danh sách an toàn"
    if (mode === "build") {
      const msg = await message.reply("🔄 Đang quét thành viên hiện tại để tạo danh sách an toàn...");
      try {
        const members = await message.guild.members.fetch();
        const currentIds = Array.from(members.keys());

        await setKey("all_users", currentIds);
        return msg.edit(`✅ Đã lưu **${currentIds.length}** ID vào danh sách \`all_users\`. Từ nay bạn có thể dùng \`.cleanup run\`.`);
      } catch (err) {
        return msg.edit("❌ Lỗi khi lấy danh sách thành viên.");
      }
    }

    // --- CHẾ ĐỘ 2: RUN (Dọn dẹp dựa trên danh sách đã có) ---
    if (mode === "run") {
      const msg = await message.reply("🔄 Đang đối chiếu danh sách để dọn dẹp...");
      try {
        // Lấy danh sách ID đã lưu từ lệnh build
        let allSavedUserIds = (await getKey("all_users")) || [];
        if (allSavedUserIds.length === 0) return msg.edit("⚠️ Danh sách trống. Hãy gõ `.cleanup build` trước.");

        // TỐI ƯU: Fetch danh sách thành viên mới nhất, không lấy trạng thái online/offline để nhẹ hơn
        const members = await message.guild.members.fetch({ withPresences: false });
        const currentMemberIds = new Set(members.keys());

        let deletedCount = 0;
        const userDataTypes = ["inventory", "fishtank", "fish_inv", "daily", "rpg_user","mora",'primo'];

        let newSavedUserIds = [];
        for (const userId of allSavedUserIds) {
          if (!currentMemberIds.has(userId)) {
            for (const type of userDataTypes) {
              await deleteKey(renderKey(type, userId));
            }

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
            }

            //bienban
            const bbKey = renderKey("bienban", guildId);
            const bienban = (await getKey(bbKey)) || [];
            const userbb = bienban.find(c => c.userId === userId);

            if(userbb){
                const updatebb = bienban.filter(c =>
                    c.userId === userId
                );

                await setKey(bbKey, updatebb);    
            }

            //sn
            const snKey = `birthday_${guildId}`;
            const snData = (await getKey(snKey)) || {};
            if(snData[userId]){
              const filterData = Object.fromEntries(Object.entries(snData).filter(([key,value])=> key !== userId));
              await setKey(snKey, filterData); 
            }

            deletedCount++;
          } else {
            // Nếu vẫn còn ở server, giữ lại trong danh sách an toàn
            newSavedUserIds.push(userId);
          }
        }

        // Cập nhật lại danh sách all_users mới (đã loại bỏ những người vừa bị xóa)
        await setKey("all_users", newSavedUserIds);
        return msg.edit(`✅ Đã dọn dẹp xong **${deletedCount}** người rời server. Còn lại **${newSavedUserIds.length}** người trong danh sách theo dõi.`);
      } catch (err) {
        console.error(err);
        return msg.edit(`❌ Lỗi khi dọn dẹp: \`${err.message}\`. Hãy thử chạy lại sau vài giây.`);
      }
    }
  },
};