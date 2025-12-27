// --- CẤU HÌNH ---
const ELEMENTS_CONFIG = {
  hoa: {
    name: "Hỏa",
    emoji: "🔥",
    ref: 0xff4500,
    stats: { atk: 25, hp: 100 },
    skill: "Hỏa Cầu",
  },
  bang: {
    name: "Băng",
    emoji: "❄️",
    ref: 0x00ffff,
    stats: { atk: 10, hp: 180 },
    skill: "Băng Vĩnh Cửu",
  },
  thuy: {
    name: "Thủy",
    emoji: "💧",
    ref: 0x1e90ff,
    stats: { atk: 15, hp: 150 },
    skill: "Sóng Thần",
  },
  thao: {
    name: "Thảo",
    emoji: "🌿",
    ref: 0x32cd32,
    stats: { atk: 18, hp: 130 },
    skill: "Dây Leo Quấn",
  },
  nham: {
    name: "Nham",
    emoji: "🪨",
    ref: 0xffd700,
    stats: { atk: 12, hp: 200 },
    skill: "Địa Chấn",
  },
  loi: {
    name: "Lôi",
    emoji: "⚡",
    ref: 0x9932cc,
    stats: { atk: 22, hp: 110 },
    skill: "Thiên Lôi",
  },
};

const QUESTS = {
  hunt: [
    {
      id: "h1",
      name: "Thợ săn tập sự",
      target: 20,
      rewardMora: 8000,
      rewardGems: 5,
      desc: "Săn 20 lần (hunt)",
      type: "hunt",
    },
    {
      id: "h2",
      name: "Thợ săn lành nghề",
      target: 40,
      rewardMora: 15000,
      rewardGems: 8,
      desc: "Săn 40 lần (hunt)",
      type: "hunt",
    },
    {
      id: "h3",
      name: "Vua săn mồi",
      target: 80,
      rewardMora: 17000,
      rewardGems: 12,
      desc: "Săn 80 lần (hunt)",
      type: "hunt",
    },
  ],

  battle: [
    {
      id: "b1",
      name: "Chiến binh tinh nhuệ",
      target: 10,
      rewardMora: 19000,
      rewardGems: 12,
      desc: "Thắng 10 trận (battle)",
      type: "battle",
    },
    {
      id: "b2",
      name: "Chiến binh bất bại",
      target: 30,
      rewardMora: 20000,
      rewardGems: 15,
      desc: "Thắng 30 trận (battle)",
      type: "battle",
    },
    {
      id: "b3",
      name: "Huyền thoại chiến trường",
      target: 50,
      rewardMora: 25000,
      rewardGems: 18,
      desc: "Thắng 50 trận (battle)",
      type: "battle",
    },
  ],

  dungeon: [
    {
      id: "d1",
      name: "Kẻ chinh phục Phó bản",
      target: 5,
      rewardMora: 30000,
      rewardGems: 20,
      desc: "Vượt 5 lần Phó bản (dungeon)",
      type: "dungeon",
    },
    {
      id: "d2",
      name: "Nhà thám hiểm Phó bản",
      target: 15,
      rewardMora: 35000,
      rewardGems: 25,
      desc: "Vượt 15 lần Phó bản (dungeon)",
      type: "dungeon",
    },
    {
      id: "d3",
      name: "Bá chủ Phó bản",
      target: 30,
      rewardMora: 40000,
      rewardGems: 30,
      desc: "Vượt 30 lần Phó bản (dungeon)",
      type: "dungeon",
    },
  ],
};

module.exports={
    ELEMENTS_CONFIG,
    QUESTS
}