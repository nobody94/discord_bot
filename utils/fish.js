const FISH_LIST = {
  "chiec_ung_cu": { 
        name: "Chiếc Ủng Cũ", 
        icon: "🥾", 
        sellPrice: 5, 
        currency: "mora", 
        chance: 0.10 
    },
    "vo_chuoi": { 
        name: "Vỏ Chuối", 
        icon: "🍌", 
        sellPrice: 3, 
        currency: "mora", 
        chance: 0.18 
    },
    "vo_chai_bia": { 
        name: "Vỏ Chai bia", 
        icon: "🍾", 
        sellPrice: 3, 
        currency: "mora", 
        chance: 0.18 
    },
    "tui_nilon": { 
        name: "Túi Nilon", 
        icon: "🛍️", 
        sellPrice: 2, 
        currency: "mora", 
        chance: 0.15 
    },
    "xuong_ca": { 
        name: "Bộ Xương Cá", 
        icon: "🦴", 
        sellPrice: 1, 
        currency: "mora", 
        chance: 0.12 
    },
    "ca_long_tong": { 
        name: "Cá Lòng Tong", 
        icon: "🐟", 
        sellPrice: 20, 
        currency: "mora", 
        chance: 0.50 
    },
    "ca_chep": { 
        name: "Cá Chép Vàng", 
        icon: "🎏", 
        sellPrice: 300, 
        currency: "mora", 
        chance: 0.30
    },
    "sua": { 
        name: "Sứa", 
        icon: "🪼", 
        sellPrice: 500, 
        currency: "mora", 
        chance: 0.50 
    },
     "tom_hum": { 
        name: "Tôm hùm", 
        icon: "🦞", 
        sellPrice: 1000, 
        currency: "mora", 
        chance: 0.1 
    },
    "bach_tuoc": { 
        name: "Bạch Tuộc Khổng Lồ", 
        icon: "🐙", 
        sellPrice: 5000, 
        currency: "mora", 
        chance: 0.02 
    },   
    "ca_map": { 
        name: "Cá Mập Trắng", 
        icon: "🦈", 
        sellPrice: 3000, 
        currency: "mora", 
        chance: 0.05 
    },    
    "rua_bien": { 
        name: "Rùa Biển", 
        icon: "🐢", 
        sellPrice: 50000, 
        currency: "mora", 
        chance: 0.005,
        lovePoint:10
    },
    "ca_voi": { 
        name: "Cá Voi Xanh", 
        icon: "🐳", 
        sellPrice: 80000, 
        currency: "mora", 
        chance: 0.003,
        lovePoint:20
    },
     "ca_heo": { 
        name: "Cá Heo Hồng", 
        icon: "<:dolphin:1454324539210203238>", 
        sellPrice: 120000, 
        currency: "mora", 
        chance: 0.001,
        lovePoint:50 
    }, 
};

const FISH_SHOP_ITEMS = {
  "cancau_go": {
    name: "Cần Câu Gỗ",
    icon: "🎣",
    price: 5000,
    luck: 1.0,
    maxDurability: 30,
    currency: "mora",
    description: "Cần câu cơ bản cho người mới bắt đầu.",
  },
  "cancau_carbon": {
    name: "Cần Câu Sợi Carbon",
    icon: "🎋",
    price: 50000,
    luck: 1.5,
    maxDurability: 60,
    currency: "mora",
    description: "Nhẹ và nhạy, dễ bắt cá xịn hơn",
  },
  "cancau_hoang_kim": {
    name: "Cần Câu Hoàng Kim",
    icon: "🔱",
    price: 100000,
    luck: 3.0,
    maxDurability: 100,
    currency: "mora", 
    description: "Cần câu huyền thoại, tăng tỉ lệ gặp cá hiếm cực cao.",
  },

  // --- MỒI CÂU (BAITS) ---
  "moica_thuong": {
    name: "Mồi Cá Thường",
    icon: "🪱",
    price: 5,
    currency: "mora",
    luck: 1.0,
    description: "Mồi câu phổ thông, đủ để dụ mấy con cá nhỏ.",
  },
  "moica_xin": {
    name: "Mồi Cá Cao Cấp",
    icon: "🐛",
    price: 50,
    currency: "mora",
    luck: 2.0,
    description: "Mùi vị hấp dẫn hơn, tăng tỉ lệ cá cắn câu.",
  }  
};

module.exports = { FISH_LIST, FISH_SHOP_ITEMS };
