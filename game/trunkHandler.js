const { getKey, renderKey, setKey } = require("../utils/db");
const { getIcon, addMoney, checkPay } = require("../utils/currency.js");
const { SHOP_ITEMS, BLIND_BOX_LOOT } = require("../utils/shop");
const { errorIcon, verifyIcon } = require("../utils/icon.js");

async function trunkHandler(args, message, inventory, invKey, userId){
    
}

module.exports = { trunkHandler };