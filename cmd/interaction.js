const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const {
  getCustomDate,
  MAX_LOVE_POINTS_PER_DAY,
} = require("../utils/constant.js");
const { setKey, getKey, renderKey } = require("../utils/db");

// Danh sách các lệnh và tag tương ứng trên API
const interactions = {
  pat: { tag: "pat", color: "#ffcc00", msg: "đã xoa đầu" },
  poke: { tag: "poke", color: "#00ccff", msg: "đã chọc" },
  bite: { tag: "bite", color: "#ff5555", msg: "đã cắn" },
  punch: {
    tag: "punch",
    color: "#880000",
    msg: "đã đấm",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jZln1k7P9dO3g2Dgu4/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qPzZQtsv21zjy/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OpvUphysvKumQ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ptmWoT5ZoeStn3PP5v/giphy.gif",
    ],
    lovePoint: -10,
  },
  bonk: {
    tag: "bonk",
    color: "#000000",
    msg: "đã gõ đầu",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pPs4HwdYb46fWfnpje/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/K2PhVaUSgGKkDsXeEa/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/rfHc3U73N07tKPgCvJ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fsa01PUHKndNNCcadS/giphy.gif",
    ],
    lovePoint: -5,
  },
  slap: { tag: "slap", color: "#ff4500", msg: "đã tát", lovePoint: -10 },
  hug: {
    tag: "hug",
    color: "#00ff00",
    msg: "đã trao một cái ôm ấm áp với",
    lovePoint: 5,
  },
  kiss: {
    tag: "kiss",
    color: "#FF1493",
    msg: "đã trao một nụ hôn nồng cháy cho",
    lovePoint: 10,
  },
  airkiss: {
    tag: "airkiss",
    color: "#add8e6",
    msg: "đã gửi một nụ hôn gió tới",
    lovePoint: 5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2l1eXo2eHZsb3EzbXBsc3RncmltbDJ1cDJuY3lobzRhcnIxYnA4MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/HN0vI0nbR9jX2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWpsemJ2dXRlYTZsajFiaHc2cmQ0cnVoa3c5enNkZ3B4eW1zNDY5aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uAvMPK3narqc8/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZjZvMGk2N2R4aXp4OW5wd2p4dzFmbDhrYXJ2aDR1OWp2dDVoODdnNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9VTe635RMSfEkGaZGd/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N3l0ZXNsc2MybDQycGV3eDM0dnBvbGZiNDNwczZhY282eW9laGF3dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VLqvh9JBs0lQnIOOn5/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzFkcGlua292dDd5bzg5bXR4ejh4aTVucWozZXJhZmNkM3duZ2p0NyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108M7gCS1JSoO4/giphy.gif",
    ],
  },
  cuddle: {
    tag: "cuddle",
    color: "#FFB6C1",
    msg: "đã ôm ấp thật nồng thắm với",
    lovePoint: 5,
  },
  lick: {
    tag: "lick",
    color: "#FF69B4",
    msg: "đã liếm",
    lovePoint: 5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5cREBFcGOkC2I/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8GiREm7aqMwN2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mG8g5NyTfJkqH4xk0d/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DTbmKtrYbwUkw1Inyv/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHJqMnhmdGNqdGd4d3p0Z2cwc2kxY3BudmEwcmdrNXZlbzZkcGlkZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bfPYlvbKB4Q1xCczLs/giphy.gif",
    ],
  },
  kick: {
    tag: "kick",
    color: "#8B0000",
    msg: "đã tung một cú đá sấm sét vào",
    lovePoint: -10,
  },
  highfive: {
    tag: "highfive",
    color: "#00FF7F",
    msg: "đã đập tay cực ngầu với",
    lovePoint: 2,
  },
  stare: {
    tag: "stare",
    color: "#4682B4",
    msg: "đang nhìn chằm chằm (phán xét) vào",
    lovePoint: -2,
  },
  laugh: {
    tag: "laugh",
    color: "#f1c40f",
    msg: "đã cười vào mặt của",
    lovePoint: -5,
  },
  cheek: {
    tag: "cheek",
    color: "#FFCCFF",
    msg: "đã thơm má",
    lovePoint: 5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Bkd3djcWZodGkxNXd3NHFqaGx6NDNjcWNwd2c4ajV0NzZtN3EzeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gRSqTmhQ3ayroAQ04S/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qfQgXxBz1nvWEbOxyb/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2NkcDdoejEwb3NkNDl0YXl2aHJ1NDIxaGF1cWhrZzZ1bmMwZzRnciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4Tw8zXonwNkLS/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xR5cPyPoL5HVXSphqA/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmxmoHUGPDjfQXqGgv/giphy.gif",
    ],
  },
  pinch: {
    tag: "pinch",
    color: "#9b59b6",
    msg: "đã véo má",
    lovePoint: -5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NnUyZGM3bHJ6YXR1M28xZGo4MGt0d2RtYW93NW9qdmI0cGd2azgydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MC7fYhbA4ociQ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o6nUWtsrEqktR2fcY/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BzZBWdEkSFQAhwwxkt/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YFpZFrk2iHv7l7UEin/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b2eTtzh6tMs7KVoFzV/giphy.gif",
    ],
  },
  nibled: {
    tag: "nibled",
    color: "#FF1493",
    msg: "đã cắn yêu",
    lovePoint: 2,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DdJ9RsY88uBarMvVsb/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YW3obh7zZ4Rj2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0Iy0QdzD3AA6bgIg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXYya25kbzlvczAycWdxOXhuNmV1MHkxZDRiaGo1MTdmeG9lOXRrZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108wBdjDIkQZb2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ejUyeHUzZXcwcnl3cHNjaHZkOG80djBqNWdobG11N2FyeXU1YTB0OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LO9Y9hKLupIwko9IVd/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjJuOXl4aTRlbnR5czhsazlzdW42eHIwMWE2dmtoNGJmeWY0engzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/F7EakqG1ICDnRSe9ff/giphy.gif",
    ],
  },
  fight: {
    tag: "fight",
    color: "#FF4500",
    msg: "đã đánh nhau với",
    lovePoint: -10,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2Pk9newN8fkbu/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eR7OEDQDyA7Cg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6ULDGyRw0uhECEhAaQ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/f5UwtpUbrAEE0/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wiaoWlW17fqIo/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmG26GNmdWOUE/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1xONKAmjT1GHFpkLRd/giphy.gif",
    ],
  },
  rip: {
    tag: "rip",
    color: "#FF4500",
    msg: "thành kính tưởng nhớ",
    lovePoint: -5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JoV2BiMWVZ96taSewG/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12UPyerJpVC2PzWkrz/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/56MCwZ3SCzp1NjSirn/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3c2V6N2lqaHNleWJ0cnk5MWlkYjl6eTVzNzdnY3lvN2RmeDQwajFtNCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/j6ZlX8ghxNFRknObVk/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YTV1OW0wMWdvNzFwOHFleGkzaWw4d3dsMnZjamk2NDV2cnBtcXMxYSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cJ4F7Tj2PZaDiLNvW5/giphy.gif",
    ],
  },
  spank: {
    tag: "spank",
    color: "#FF4500",
    msg: "đã tét đuýt",
    lovePoint: -5,
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWxkenp6ZHh3eDZreWJ3ZThlcG4zOXNpajc4dTBuOXhzOTZ3NG5ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/v4UdKrxhIiB1QFmO6b/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWI4NGxvNTdhdzg1bjd0cHlqMWUwcTNieW9yMHc4eTJmMHhzZ2p4OCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/1gv7WwUYJlaRKWVtok/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWI4NGxvNTdhdzg1bjd0cHlqMWUwcTNieW9yMHc4eTJmMHhzZ2p4OCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cl3EMK5vlECNO2UJr2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3p4Zmw5MDBrc2RmMXZydHF4bzdvMXo3YW0ycjBsZnN2ZXNiNjFhYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pRotk2UQTsozm/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eDAzaGZ4M3I2Ym44bGp0OGRicnFkcndrcGRoNmRteXVlNTRxZWw2eCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/jdrgQXu2qdL1e/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eDAzaGZ4M3I2Ym44bGp0OGRicnFkcndrcGRoNmRteXVlNTRxZWw2eCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cxWG5eigQt1K0/giphy.gif",
    ],
  },
};

module.exports = {
  name: "interaction",
  aliases: Object.keys(interactions),
  async execute(message, args, commandName) {
    // commandName là tên lệnh người dùng nhập (ví dụ: pat, poke...)
    const config = interactions[commandName];
    if (!config) return;

    const target = message.mentions.users.first();
    if (!target) return message.reply(`Bạn phải tag ai đó để ${config.msg}!`);

    let gifUrl = null;

    if (config.images && config.images.length > 0) {
      gifUrl = config.images[Math.floor(Math.random() * config.images.length)];
    }

    try {
      // THỬ API 1: Nekos.best (Rất ổn định cho các tag tương tác)
      const res = await axios.get(`https://nekos.best/api/v2/${config.tag}`);
      gifUrl = res.data.results[0].url;
    } catch (err) {
      try {
        // THỬ API 2: Waifu.im (Dự phòng nếu Nekos.best lỗi)
        const res = await axios.get(
          `https://api.waifu.im/search?included_tags=${config.tag}&is_nsfw=false&limit=1`
        );
        gifUrl = res.data.images[0].url;
      } catch (err2) {
        console.error("Cả 2 API đều thất bại:", err2.message);
      }
    }

    // --- LOGIC THÂN MẬT ---
    let loveNote = "";
    const guildId = message.guild.id;
    const userId = message.author.id;
    const coupleKey = renderKey("couple", guildId);
    let couplesList = (await getKey(coupleKey)) || [];

    const coupleIndex = couplesList.findIndex(
      (c) =>
        (c.husband === message.author.id && c.wife === target.id) ||
        (c.husband === target.id && c.wife === message.author.id)
    );

    if (coupleIndex !== -1) {
      const today = getCustomDate();
      const couple = couplesList[userCoupleIndex];
      const partnerId =
        couple.husband === userId ? couple.wife : couple.husband;

      // Reset điểm ngày nếu qua 4h sáng
      if (couple.lastGiftDate !== today) {
        couplesList[coupleIndex].lastGiftDate = today;
        couplesList[coupleIndex].dailyLovePoints = 0;
      }

      const points = config.lovePoint || 0;
      const currentDaily = couplesList[coupleIndex].dailyLovePoints || 0;

      if (target.id === partnerId) {
        if (points < 0) {
          // Hành động tiêu cực: Luôn trừ điểm
          couplesList[coupleIndex].lovePoints =
            (couplesList[coupleIndex].lovePoints || 0) + points;
          loveNote = `\n💔 Thân mật: **${points}** (Đừng bạo lực thế chứ!)`;
        } else {
          // Hành động tích cực: Kiểm tra giới hạn ngày
          const remaining = MAX_LOVE_POINTS_PER_DAY - currentDaily;
          if (remaining > 0) {
            const added = Math.min(points, remaining);
            couplesList[coupleIndex].lovePoints =
              (couplesList[coupleIndex].lovePoints || 0) + added;
            couplesList[coupleIndex].dailyLovePoints = currentDaily + added;
            loveNote = `\n💖 Thân mật: **+${added}** điểm!`;
          }
        }
      }else if(points>0 && target.id !== partnerId && target.id !== userId){
        couplesList[coupleIndex].lovePoints = (couplesList[coupleIndex].lovePoints || 0) - points;
        loveNote = `\n🔥 **Bắt quả tang!** Bạn dám ${config.tag} người khác sao? \n💔 Bạn đời của bạn đã buồn và hai bạn bị trừ **${penalty}** điểm thân mật!`;
      }

      await setKey(coupleKey, couplesList);
    }
    // --- KẾT THÚC LOGIC THÂN MẬT ---

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription(
        `**${message.author.username}** ${config.msg} **${target.username}**!${loveNote}`
      )
      .setImage(gifUrl);

    message.reply({ embeds: [embed] });
  },
};
