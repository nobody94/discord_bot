const { getKey, setKey } = require("../utils/db");

async function removeHandler(member) {
  const guildId = member.guild.id;
  const leaveKey = `left_member_${guildId}`;
  let list = (await getKey(leaveKey)) || [];

  list = list.filter((u) => u.userId !== member.id);
  list.push({
    userId: member.id,
    tag: member.user.tag,
    leftAt: Date.now(),
  });

  await setKey(leaveKey, list);
}

async function addHandler(member) {
  const guildId = member.guild.id;
  const userId = member.id;
  const key = `left_member_${guildId}`;

  // 1. Lấy danh sách chờ xóa của server này
  let leftList = (await getKey(key)) || [];

  if (leftList.length > 0) {
    // 2. Tìm xem người vừa join có trong danh sách chờ xóa không
    const isWaiting = leftList.some((u) => u.userId === userId);

    if (isWaiting) {
      // 3. Lọc người đó ra khỏi danh sách
      const newList = leftList.filter((u) => u.userId !== userId);

      // 4. Cập nhật lại database
      if (newList.length > 0) {
        await setKey(key, newList);
      } else {
        await deleteKey(key); // Xóa luôn key nếu không còn ai chờ
      }
    }
  }
}

module.exports = {
  removeHandler,
  addHandler,
};
