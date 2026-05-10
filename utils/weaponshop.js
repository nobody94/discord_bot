const { CURRENCIES } = require("./currency");

const mora = CURRENCIES.mora.key;
const primo = CURRENCIES.primo.key;

const type = {
    damage:'damage',
    healing:'healing',
    revive:'revive'
}

const desc = {
  healing: "Vật phẩm dùng để trị thương",
  damage: "Vật phẩm dùng để gây thương tích",  
  revive: "Vật phẩm dùng để hồi sinh đồng đội",
};

const SHOP_ITEMS = {
    rock: {
        name: "Đá",
        icon: "🪨",
        price: 1000,
        sellPrice: 1000,
        currency: mora,
        type:type.damage,
        description: desc.damage,
        maxAmount:5,
        minDmg:1,
        maxDmg:15
    },
    brick: { 
        name: "Gạch", 
        icon: "🧱", 
        price: 5000, 
        sellPrice: 5000,
        currency: mora,
        type:type.damage,
        description: desc.damage,
        maxAmount:2,
        minDmg:10,
        maxDmg:25
    },
    heal_1: {
        name: "Băng Gạc Nano",
        icon: "🩹",
        price: 2000,
        sellPrice: 2000,
        type:type.healing,
        currency: mora,
        description: desc.healing,
        minHeal: 21, 
        maxHeal: 30,
        minHealOther: 16, 
        maxHealOther: 25,
    },
    heal_2: {
        name: "Huyết Thanh Sơ Cứu",
        icon: "🩹",
        price: 1500,
        sellPrice: 1500,
        type:'healing',
        currency: mora,
        description: desc.healing,
        minHeal: 11, 
        maxHeal: 20, 
        minHealOther: 6,  
        maxHealOther: 15,
    },
    heal_3: {
        name: "Miếng Dán Hồi Phục",
        icon: "🩹",
        price: 1000,
        sellPrice: 1000,
        type:type.healing,
        currency: mora,
        description: desc.healing,
        minHeal: 1,  
        maxHeal: 10, 
        minHealOther: 1,  
        maxHealOther: 5,
    },
    medkit: {
        name: "Hộp Cứu Thương",
        icon: "🧰",
        price: 5000,
        sellPrice: 5000,
        type:type.revive,
        currency: mora,
        description: desc.revive,
        minHeal: 0,  
        maxHeal: 0, 
        minHealOther: 20,  
        maxHealOther: 20,
    },
};

module.exports = {
  SHOP_ITEMS,
  type
};