const { renderKey, getKey, setKey } = require("./utils/db");

async function removeHandler(member){
    console.log(`📡 Phát hiện ${member.user.tag} đã rời khỏi server.`);
    const userId = member.id;
    const guildId = member.guild.id;   

    // Xử lý dữ liệu cặp đôi (Couples)
    const coupleKey = renderKey('couple', guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    // Tìm xem người rời đi có nằm trong cặp đôi nào không
    const coupleIndex = couplesList.findIndex(c => c.husband === userId || c.wife === userId);

    if (coupleIndex !== -1) {
        console.log(`💔 Tự động hủy hôn ước của ${userId} do đã rời server.`);
        couplesList.splice(coupleIndex, 1); // Xóa cặp đôi này khỏi danh sách
        await setKey(coupleKey, couplesList);
    }

    
}

module.exports ={
    removeHandler
}