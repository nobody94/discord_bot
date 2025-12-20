const SHOP_ITEMS = {
    'nhan_kim_cuong': {
        name: 'Nhẫn kim cương',
        price: 300000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:diamond_ring:1451058258944065638>',
        canOpen: false
    },
    'gau_bong': {
        name: 'Gấu bông',
        price: 100000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:bear:1451058314237448284>',
        canOpen: false
    },
    'tra_sua': {
        name: 'Trà sữa',
        price: 30000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:milktea:1451058355857522883>',
        canOpen: false
    },
    'kem': {
        name: 'Kem',
        price: 50000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:icecream:1451606564698853519>',
        canOpen: false
    },
    'pizza': {
        name: 'Pizza',
        price: 100000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:pizza:1451606591983058994>',
        canOpen: false
    },
    'burger': {
        name: 'Burger',
        price: 100000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:fastfood:1451606621137670144>',
        canOpen: false
    },
    'my_ly': {
        name: 'Mỳ ly',
        price: 20000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:instantnoodles:1451606651588317357>',
        canOpen: false
    },
    'my_tom': {
        name: 'Mỳ tôm',
        price: 30000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:ramen:1451606668826775573>',
        canOpen: false
    },
    'thit_xien': {
        name: 'Thịt xiên nướng',
        price: 20000,
        currency: 'mora',
        description: 'Dùng để tặng cho đối tượng bạn thích',
        icon: '<:barbecue:1451606702632865813>',
        canOpen: false
    },
    'tui_mu': {
        name: 'Túi mù',
        price: 50,
        currency: 'primo',
        description: 'Mở ra ngẫu nhiên vật phẩm hiếm',
        icon: '<:blindbox:1451618660673130546>',
        canOpen: true
    },
    'tui_rac': {
        name: 'Vật phẩm gacha',
        price: 5,
        currency: 'primo',
        description: 'Vật phẩm cực hiếm chỉ có từ túi mù',
        icon: '<:garbage:1451606744295018578>',
        hideFromShop: true
    }
};

const BLIND_BOX_LOOT = {
    "tui_mu": [
        { item: "tui_rac", amount: 1, rate: 60 },
        { item: "mora", amount: 200, rate: 20 },
        { item: "mora", amount: 1000, rate: 15 },
        { item: "primo", amount: 5, rate: 5 },
    ]
};

module.exports = {
    SHOP_ITEMS,
    BLIND_BOX_LOOT
}