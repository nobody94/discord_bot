const { CURRENCIES } = require("./currency");

const mora = CURRENCIES.mora.key;
const primo = CURRENCIES.primo.key;

const type = {
    damage: 'damage',
    healing: 'healing',
    revive: 'revive'
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
        price: 5000,
        sellPrice: 5000,
        currency: mora,
        type: type.damage,
        description: desc.damage,
        maxAmount: 5,
        minDmg: 1,
        maxDmg: 15
    },
    brick: {
        name: "Gạch",
        icon: "🧱",
        price: 25000,
        sellPrice: 25000,
        currency: mora,
        type: type.damage,
        description: desc.damage,
        maxAmount: 2,
        minDmg: 10,
        maxDmg: 25
    },
    heal_1: {
        name: "Huyết Thanh Sơ Cứu",
        icon: "💉",
        price: 10000,
        sellPrice: 10000,
        type: type.healing,
        currency: mora,
        description: desc.healing,
        minHeal: 21,
        maxHeal: 30,
        minHealOther: 16,
        maxHealOther: 25,
    },
    heal_2: {
        name: "Băng Gạc Nano",
        icon: "🩹",
        price: 7000,
        sellPrice: 7000,
        type: 'healing',
        currency: mora,
        description: desc.healing,
        minHeal: 11,
        maxHeal: 20,
        minHealOther: 6,
        maxHealOther: 15,
    },
    heal_3: {
        name: "Con Nhộng Thần Kì",
        icon: "💊",
        price: 5000,
        sellPrice: 5000,
        type: type.healing,
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
        price: 10000,
        sellPrice: 10000,
        type: type.revive,
        currency: mora,
        description: desc.revive,
        minHeal: 0,
        maxHeal: 0,
        minHealOther: 20,
        maxHealOther: 20,
    },
};

const gifImages = {
    default:[
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Q1MWtjcmZ6YXgyaXptcHU2N2V6bnhlbTZudGJjdm1sbmZ4bTdobyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/o5IxfV1v8oU1vZUeZA/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Q1MWtjcmZ6YXgyaXptcHU2N2V6bnhlbTZudGJjdm1sbmZ4bTdobyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/oBr4OtvIPUUB6LBGXH/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Q1MWtjcmZ6YXgyaXptcHU2N2V6bnhlbTZudGJjdm1sbmZ4bTdobyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/87W25wCsdhAkhwsSrX/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Q1MWtjcmZ6YXgyaXptcHU2N2V6bnhlbTZudGJjdm1sbmZ4bTdobyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/g1KyXtU27EEOWAo8zs/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ejZ1Y2F2Mjh1NGlvdDFiMmR6ZWdubXd4eGJ0YzhrdWNqNm9hMDdicCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jQWAQrEWzN2oWaowd5/giphy.gif"
    ],
    rock:[
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29lbjB0ZHBiMXNwemM0ZDFqNWowcHB2azQyaDh5OWV0b3U4cnp1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bVjLUMAFD5LZr1iRMc/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29lbjB0ZHBiMXNwemM0ZDFqNWowcHB2azQyaDh5OWV0b3U4cnp1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9x1gUZ17as6dzdBEh3/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29lbjB0ZHBiMXNwemM0ZDFqNWowcHB2azQyaDh5OWV0b3U4cnp1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ElBsC0qfUQAWc7DbbJ/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29lbjB0ZHBiMXNwemM0ZDFqNWowcHB2azQyaDh5OWV0b3U4cnp1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/orh5wKIlhsVbzwKkfa/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29lbjB0ZHBiMXNwemM0ZDFqNWowcHB2azQyaDh5OWV0b3U4cnp1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/rlEPLlD82hYTnusG4U/giphy.gif"
    ],
    brick:[
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXpxc25nY2pjMDB1bzFvNzN3OGNybWU1OW9mdDY0MjR0bW94bmYzbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Dh8op07q1r2DHB6bSk/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXpxc25nY2pjMDB1bzFvNzN3OGNybWU1OW9mdDY0MjR0bW94bmYzbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/aGGkl2RL7MvGnPq3Qm/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXAxdDl6eXp5dmM5dWQ4cWI4MGh5NnpvemRwMXQ2djVkZmViM2V6bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/0cE7q0fPYMNQSFLWv6/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXFpM3ZkeGFhcWE0YXk1aG9lcWNtNnRqbHp6OHRoY2xoMWMxbnV4dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/j8PeZ13MTDFIy5aFAV/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXpxc25nY2pjMDB1bzFvNzN3OGNybWU1OW9mdDY0MjR0bW94bmYzbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cJl8GcNJZ0cjOeljQ6/giphy.gif"
    ],
    poop:[
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29wdTdpMXN2dGdpM2doOWg5c203OHBzeWdob3BmN2t3cnVxa3FnYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/le2BbXSV0OYycPAfdG/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnowMms0NW1wdmhhdzgyejVrdXNvbzM4c283OHgwNmprczA1aGRlcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12laWv0ZXn8kM/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NzE3ZzI0c3RwcDNxYWFzZXRvZ2ZrbXRodHRlOWx1ZzRxcWZncjRtZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/21JAB6c2Me9wG0E5pp/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dGIzd3p5ejcxZDE0N3QyZ3pvM2xnY2VuNjZoZnN4aHdicHJpc2NkdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l41lKL8ivoSHij2lW/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Y2VpMXkwM2JwNTRtbHFqMmlyMzZuYzllZndwb3hqazJkYnMzMTVhcSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hCBC9pINk5d6VxIA88/giphy.gif"
    ]
}

module.exports = {
    SHOP_ITEMS,
    type,
    gifImages
};