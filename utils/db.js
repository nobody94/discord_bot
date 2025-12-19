const { Database } = require("quickmongo");

const mongoUrl = process.env.MONGOURL;
const db = new Database(mongoUrl);

const dbKey="nobody_bot";

function renderKey(key,id){
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

module.exports={
    db,renderKey,setKey,getKey,pushKey,addKey
}