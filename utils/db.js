const { Database } = require("quickmongo");

const mongoUrl = process.env.MONGOURL;
const db = new Database(mongoUrl);

const dbKey="nobody_bot";

function renderKey(key,id){
    if(!id){
        return `${dbKey}_${key}`
    }
    return `${dbKey}_${key}_${id}`
}

async function setKey(key,data){
    return await db.set(key,data);
}

async function addKey(key,data){
    return await db.add(key,data);
}

async function getKey(key){
    return await db.get(key);
}

async function pushKey(key,data){
    return await db.push(key, data)
}

async function deleteKey(key) {
    return await db.delete(key);
}

// Hàm cập nhật bảng xếp hạng
async function updateLeaderboard(type, userId, username,guildId) {
  const key = `leaderboard_${type}_${guildId}`; // leaderboard_miss hoặc leaderboard_trash
  let data = (await getKey(key)) || [];
  
  let userEntry = data.find(u => u.id === userId);
  if (userEntry) {
    userEntry.count += 1;
    userEntry.name = username; // Cập nhật tên mới nhất
  } else {
    data.push({ id: userId, name: username, count: 1 });
  }
  
  // Sắp xếp và chỉ giữ lại Top 10 để tránh nặng DB
  data.sort((a, b) => b.count - a.count);
  data = data.slice(0, 10);
  
  await setKey(key, data);
}

async function migrateData(type, guildId) {
  const oldKey = `leaderboard_${type}_${guildId}}`;
  const newKey = `leaderboard_${type}_${guildId}`;

  const oldData = await getKey(oldKey);
  if (!oldData) return false;

  let newData = (await getKey(newKey)) || [];

  // Gộp dữ liệu cũ vào dữ liệu mới của server này
  oldData.forEach(oldEntry => {
    let existing = newData.find(u => u.id === oldEntry.id);
    if (existing) {
      existing.count += oldEntry.count; // Gộp số lần nếu đã tồn tại
    } else {
      newData.push(oldEntry);
    }
  });

  // Sắp xếp lại và lưu
  newData.sort((a, b) => b.count - a.count);
  await setKey(newKey, newData.slice(0, 10));
  
  // (Tùy chọn) Xóa key cũ sau khi chuyển đổi thành công
  // await setKey(oldKey, null); 
  
  return true;
}

module.exports={
    db,renderKey,setKey,getKey,pushKey,addKey,deleteKey,updateLeaderboard,migrateData
}