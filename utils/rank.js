const RANKS = [
    { name: "Thường dân", requiredXp: 0 },
    { name: "Phàm Tu", requiredXp: 500 },
    { name: "Luyện Khí", requiredXp: 2000 },
    { name: "Trúc Cơ", requiredXp: 10000 },
    { name: "Kết Đan", requiredXp: 50000 },
    { name: "Nguyên Anh", requiredXp: 100000 },
    { name: "Hoá Thần", requiredXp: 150000 },
    { name: "Luyện Hư", requiredXp: 200000 },
    { name: "Hợp Thể", requiredXp: 300000 },
    { name: "Đại Thừa", requiredXp: 500000 },
    { name: "Độ Kiếp", requiredXp: 1000000 },
    { name: "Phi Thăng", requiredXp: 2000000 }
];

function getRankByXp(totalXp) {
    let currentRank = RANKS[0].name;
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalXp >= RANKS[i].requiredXp) {
            currentRank = RANKS[i].name;
            break;
        }
    }
    return currentRank;
}

module.exports = { RANKS, getRankByXp }