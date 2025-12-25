const FISH_LIST = {
  "chiec_ung_cu": { 
        name: "Chiếc Ủng Cũ", 
        emoji: "🥾", 
        sellPrice: 1, 
        currency: "mora", 
        chance: 0.10 // 10% xuất hiện
    },
    "vo_chai_bia": { 
        name: "Vỏ Chuối", 
        emoji: "🍌", 
        sellPrice: 2, 
        currency: "mora", 
        chance: 0.18 // 8% xuất hiện
    },
    "tui_nilon": { 
        name: "Túi Nilon", 
        emoji: "🛍️", 
        sellPrice: 1, 
        currency: "mora", 
        chance: 0.15 // 12% xuất hiện
    },
    "xuong_ca": { 
        name: "Bộ Xương Cá", 
        emoji: "🦴", 
        sellPrice: 1, 
        currency: "mora", 
        chance: 0.12 
    },
    "ca_long_tong": { 
        name: "Cá Lòng Tong", 
        emoji: "🐟", 
        sellPrice: 50, 
        currency: "mora", 
        chance: 0.50 // 50% xuất hiện
    },
    "ca_chep": { 
        name: "Cá Chép Vàng", 
        emoji: "🎏", 
        sellPrice: 300, 
        currency: "mora", 
        chance: 0.30 // 30% xuất hiện
    },
    "ca_map": { 
        name: "Cá Mập Trắng", 
        emoji: "🦈", 
        sellPrice: 5000, 
        currency: "mora", 
        chance: 0.05 // 8% xuất hiện
    },
    "ca_voi": { 
        name: "Cá Voi Xanh", 
        emoji: "🐳", 
        sellPrice: 50, 
        currency: "primo", 
        chance: 0.005 // 0.5% xuất hiện
    }
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
    price: 100000,
    luck: 1.5,
    maxDurability: 60,
    currency: "mora",
    description: "Nhẹ và nhạy, dễ bắt cá xịn hơn",
  },
  "cancau_hoang_kim": {
    name: "Cần Câu Hoàng Kim",
    icon: "🔱",
    price: 150,
    luck: 3.0,
    maxDurability: 100,
    currency: "primo", // Bán bằng tiền hiếm
    description: "Cần câu huyền thoại, tăng tỉ lệ gặp cá hiếm cực cao.",
  },

  // --- MỒI CÂU (BAITS) ---
  "moica_thuong": {
    name: "Mồi Cá Thường",
    icon: "🪱",
    price: 100,
    currency: "mora",
    luck: 1.0,
    description: "Mồi câu phổ thông, đủ để dụ mấy con cá nhỏ.",
  },
  "moica_xin": {
    name: "Mồi Cá Cao Cấp",
    icon: "🐛",
    price: 500,
    currency: "mora",
    luck: 2.0,
    description: "Mùi vị hấp dẫn hơn, tăng tỉ lệ cá cắn câu.",
  }  
};

module.exports = { FISH_LIST, FISH_SHOP_ITEMS };
