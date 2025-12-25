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

// Hàm cập nhật bảng xếp hạng
async function updateLeaderboard(type, userId, username) {
  const key = `leaderboard_${type}`; // leaderboard_miss hoặc leaderboard_trash
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

module.exports={
    db,renderKey,setKey,getKey,pushKey,addKey,updateLeaderboard
}