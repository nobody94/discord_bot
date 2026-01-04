const {CURRENCIES} = require('./currency');

const mora = CURRENCIES.mora.key;
const primo = CURRENCIES.primo.key

const desc = {
    onlyView: 'Vật phẩm chỉ để trưng bày hoặc tặng',
    common: 'Vật phẩm bình thường chỉ có từ túi mù',
    uncommon: 'Vật phẩm không phổ biến chỉ có từ túi mù',
    rare: 'Vật phẩm hiếm chỉ có từ túi mù',
    legendary: 'Vật phẩm quý hiếm chỉ có từ túi mù',
}

const SHOP_ITEMS = {
    'tui_mu': {
        name: 'Túi mù',
        price: 5,
        sellPrice:5,
        currency: primo,
        description: 'Mở ra ngẫu nhiên vật phẩm hiếm',
        icon: '<:lootbox:1452243400332935179>',
        canOpen: true,
        lovePoint:10
    },
    'bim_bim': {
        name: 'Bim bim',
        price: 20000,
        sellPrice:20000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:chips:1451742059953389779>',
        lovePoint:5
    },
    'tra_sua': {
        name: 'Trà sữa',
        price: 30000,
        sellPrice:30000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:milktea:1451058355857522883>',
        lovePoint:8
    },
    'kem': {
        name: 'Kem',
        price: 50000,
        sellPrice:50000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:icecream:1451606564698853519>',
        lovePoint:10
    },
    'banh_kem': {
        name: 'Bánh kem',
        price: 80000,
        sellPrice:80000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:birthdaycake:1452248466016436235>',
        lovePoint:15
    },
    'xien_ban': {
        name: 'Xiên bẩn',
        price: 20000,
        sellPrice:20000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:barbecue:1451606702632865813>',
        lovePoint:7
    },
    'coca': {
        name: 'Cô ca',
        price: 10000,
        sellPrice:10000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:coca:1452491105940537647>',
        lovePoint:3
    },
    'com_nam': {
        name: 'Cơm nắm',
        price: 15000,
        sellPrice:15000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:comnam:1452491150765199484>',
        lovePoint:4
    },
    'nuoc_ep': {
        name: 'Nước ép',
        price: 25000,
        sellPrice:25000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:juice:1452491233782923284>',
        lovePoint:7
    },
    'pizza': {
        name: 'Pizza',
        price: 100000,
        sellPrice:100000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:pizza:1451606591983058994>',
        lovePoint:20
    },
    'burger': {
        name: 'Burger',
        price: 100000,
        sellPrice:100000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:fastfood:1451606621137670144>',
        lovePoint:20
    },
    'my_ly': {
        name: 'Mỳ ly',
        price: 20000,
        sellPrice:20000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:instantnoodles:1451606651588317357>',
        lovePoint:7
    },
    'my_tom': {
        name: 'Mỳ tôm',
        price: 30000,
        sellPrice:30000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:ramen:1451606668826775573>',
        lovePoint:8
    },
    'gau_bong': {
        name: 'Gấu bông',
        price: 100000,
        sellPrice:100000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:bear:1451058314237448284>',
        lovePoint:20
    },    
    'donut': {
        name: 'Donut',
        price: 30000,
        sellPrice:30000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:donut:1452491274434379978>',
        lovePoint:8
    },
    'banh_bao': {
        name: 'Bánh bao',
        price: 10000,
        sellPrice:10000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:banhbao:1452491299528773662>',
        lovePoint:3
    },
    'xuc_xich': {
        name: 'Xúc xích',
        price: 10000,
        sellPrice:10000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:xucxich:1452491332261253182>',
        lovePoint:3
    },
    'socola_box': {
        name: 'Hộp socola',
        price: 200000,
        sellPrice:200000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:chocolatebox:1452491394663841803>',
        lovePoint:40
    },
    'tui_rac': {
        name: 'Túi rác 3 ngày chưa vứt',
        price: 50,
        sellPrice:50,
        currency: mora,
        description: desc.common,
        icon: '<:garbage:1451606744295018578>',
        hideFromShop: true,
        isTrash: true
    },
    'canh_cay': {
        name: 'Cành cây vô dụng',
        price: 50,
        sellPrice:50,
        currency: mora,
        description: desc.common,
        icon: '<:twig:1451858076310437939>',
        hideFromShop: true,
        isTrash: true
    },
    'vien_da': {
        name: 'Viên đá không mấy nổi bật',
        price: 50,
        sellPrice:50,
        currency: mora,
        description: desc.common,
        icon: '<:rock:1451742232024715386>',
        hideFromShop: true,
        isTrash: true
    },
    'tat_thung': {
        name: 'Một chiếc tất bị thủng',
        price: 100,
        sellPrice:100,
        currency: mora,
        description: desc.uncommon,
        icon: '<:dirty_sock:1451742253797216427>',
        hideFromShop: true,
        isTrash: true
    },
    'bong_den': {
        name: 'Một cái bóng đèn bị hỏng',
        price: 100,
        sellPrice:100,
        currency: mora,
        description: desc.uncommon,
        icon: '<:lightbulb:1451842003905286154>',
        hideFromShop: true,
        isTrash: true
    },
    'an_do': {
        name: 'Món ăn đã bị ăn dở',
        price: 100,
        sellPrice:100,
        currency: mora,
        description: desc.uncommon,
        icon: '<:burger:1451742141331144725>',
        hideFromShop: true,
        isTrash: true
    },
    'kim_cuong': {
        name: 'Một viên kim cương quý giá',
        price: 100,
        sellPrice:100,
        currency: primo,
        description: desc.legendary,
        icon: '<:diamond:1451466638103806012>',
        hideFromShop: true,
        lovePoint:200
    },   
    'nhan_cuoi': {
        name: 'Nhẫn cưới',
        price: 100000,
        sellPrice:100000,
        currency: mora,
        description: desc.onlyView,
        icon: '<:diamond_ring:1451058258944065638>',
        hideFromShop: true
    }   
};

const BLIND_BOX_LOOT = {
    "tui_mu": [
        { item: "tui_rac", amount: 1, weight: 1000 },
        { item: "canh_cay", amount: 1, weight: 1000 },
        { item: "vien_da", amount: 1, weight: 1000 },
        { item: "tat_thung", amount: 1, weight: 800 },
        { item: "bong_den", amount: 1, weight: 800 },
        { item: "an_do", amount: 1, weight: 800 },
        { item: "mora", amount: 10000, weight: 500 },
        { item: "primo", amount: 2, weight: 200 },
        { item: "kim_cuong", amount: 1, weight: 60,isGolden: true }
    ]
};

module.exports = {
    SHOP_ITEMS,
    BLIND_BOX_LOOT
}