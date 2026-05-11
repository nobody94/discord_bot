const { getKey, renderKey, setKey } = require("./db");

async function updateHP(message,userId, damage) {
  const hpKey = renderKey("health", userId);

  // Lấy HP hiện tại từ DB, nếu null/undefined thì mặc định là 100
  let hp = (await getKey(hpKey)) ?? 100;

  // Thực hiện trừ máu
  hp -= damage;

  // Kiểm tra giới hạn để HP luôn nằm trong khoảng [0, 100]
  if (hp < 0) {
    hp = 0;
  }
  if (hp > 100) {
    hp = 100;
  }

  // Lưu HP mới vào database
  await setKey(hpKey, hp);

  const healthInfo = getHealthStatus(hp);

  // Nếu có thời gian mute và mục tiêu ở trong server
  if (healthInfo.muteTime > 0) {
    try {
      const member = await message.guild.members.fetch(userId);
      if (member && !member.permissions.has("Administrator")) {        
        await member.timeout(
          healthInfo.muteTime,
          `Trạng thái sức khỏe: ${healthInfo.status}`,
        );
      }
    } catch (error) {
      console.error("Không thể mute người dùng:", error);
    }
  }

  return hp;
}

function getHealthStatus(hp) {
  if (hp <= 0) return { status: "💔 **GỤC NGÃ**", muteTime: 180000 }; // 3 phút
  if (hp <= 20) return { status: "💘 **NGUY KỊCH**", muteTime: 120000 }; // 2 phút
  if (hp <= 80) return { status: "❤️‍🩹 **CHẤN THƯƠNG**", muteTime: 60000 }; // 1 phút
  return { status: "🏋️‍♂️ **Khỏe mạnh**", muteTime: 0 };
}

module.exports = {
  updateHP,
  getHealthStatus,
};
