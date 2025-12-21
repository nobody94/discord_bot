const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

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
  },
  bonk: {
    tag: "bonk",
    color: "#000000",
    msg: "đã gõ đầu",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pPs4HwdYb46fWfnpje/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/K2PhVaUSgGKkDsXeEa/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/rfHc3U73N07tKPgCvJ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fsa01PUHKndNNCcadS/giphy.gif"
    ],
  },
  slap: { tag: "slap", color: "#ff4500", msg: "đã tát" },
  hug: { tag: "hug", color: "#00ff00", msg: "đã trao một cái ôm ấm áp với" },
  kiss: {
    tag: "kiss",
    color: "#FF1493",
    msg: "đã trao một nụ hôn nồng cháy cho",
  },
  airkiss: {
    tag: "airkiss",
    color: "#add8e6",
    msg: "đã gửi một nụ hôn gió tới",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2l1eXo2eHZsb3EzbXBsc3RncmltbDJ1cDJuY3lobzRhcnIxYnA4MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/HN0vI0nbR9jX2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWpsemJ2dXRlYTZsajFiaHc2cmQ0cnVoa3c5enNkZ3B4eW1zNDY5aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uAvMPK3narqc8/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZjZvMGk2N2R4aXp4OW5wd2p4dzFmbDhrYXJ2aDR1OWp2dDVoODdnNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9VTe635RMSfEkGaZGd/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N3l0ZXNsc2MybDQycGV3eDM0dnBvbGZiNDNwczZhY282eW9laGF3dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VLqvh9JBs0lQnIOOn5/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzFkcGlua292dDd5bzg5bXR4ejh4aTVucWozZXJhZmNkM3duZ2p0NyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108M7gCS1JSoO4/giphy.gif"
    ],
  },
  cuddle: {
    tag: "cuddle",
    color: "#FFB6C1",
    msg: "đã ôm ấp thật nồng thắm với",
  },
  lick: {
    tag: "lick",
    color: "#FF69B4",
    msg: "đã liếm",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5cREBFcGOkC2I/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8GiREm7aqMwN2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mG8g5NyTfJkqH4xk0d/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DTbmKtrYbwUkw1Inyv/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHJqMnhmdGNqdGd4d3p0Z2cwc2kxY3BudmEwcmdrNXZlbzZkcGlkZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bfPYlvbKB4Q1xCczLs/giphy.gif"
    ]
  },
  kick: {
    tag: "kick",
    color: "#8B0000",
    msg: "đã tung một cú đá sấm sét vào",
  },
  highfive: {
    tag: "highfive",
    color: "#00FF7F",
    msg: "đã đập tay cực ngầu với",
  },
  stare: {
    tag: "stare",
    color: "#4682B4",
    msg: "đang nhìn chằm chằm (phán xét) vào",
  },
  laugh: {
    tag: "laugh",
    color: "#f1c40f",
    msg: "đã cười vào mặt của",
  },
  cheek: {
    tag: "cheek",
    color: "#FFCCFF",
    msg: "đã thơm má",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Bkd3djcWZodGkxNXd3NHFqaGx6NDNjcWNwd2c4ajV0NzZtN3EzeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gRSqTmhQ3ayroAQ04S/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qfQgXxBz1nvWEbOxyb/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2NkcDdoejEwb3NkNDl0YXl2aHJ1NDIxaGF1cWhrZzZ1bmMwZzRnciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4Tw8zXonwNkLS/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xR5cPyPoL5HVXSphqA/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmxmoHUGPDjfQXqGgv/giphy.gif"
    ]
  },
  pinch: {
    tag: "pinch",
    color: "#9b59b6",
    msg: "đã véo má",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NnUyZGM3bHJ6YXR1M28xZGo4MGt0d2RtYW93NW9qdmI0cGd2azgydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MC7fYhbA4ociQ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o6nUWtsrEqktR2fcY/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BzZBWdEkSFQAhwwxkt/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YFpZFrk2iHv7l7UEin/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b2eTtzh6tMs7KVoFzV/giphy.gif"
    ]
  },
  nibled: {
    tag: "nibled",
    color: "#FF1493",
    msg: "đã cắn yêu",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DdJ9RsY88uBarMvVsb/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YW3obh7zZ4Rj2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0Iy0QdzD3AA6bgIg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXYya25kbzlvczAycWdxOXhuNmV1MHkxZDRiaGo1MTdmeG9lOXRrZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108wBdjDIkQZb2/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ejUyeHUzZXcwcnl3cHNjaHZkOG80djBqNWdobG11N2FyeXU1YTB0OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LO9Y9hKLupIwko9IVd/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjJuOXl4aTRlbnR5czhsazlzdW42eHIwMWE2dmtoNGJmeWY0engzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/F7EakqG1ICDnRSe9ff/giphy.gif"
    ]
  },
  fight: {
    tag: "fight",
    color: "#FF4500",
    msg: "đã đánh nhau với",
    images: [
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2Pk9newN8fkbu/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eR7OEDQDyA7Cg/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6ULDGyRw0uhECEhAaQ/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/f5UwtpUbrAEE0/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wiaoWlW17fqIo/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmG26GNmdWOUE/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1xONKAmjT1GHFpkLRd/giphy.gif"
    ]
  }
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

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setDescription(
        `**${message.author.username}** ${config.msg} **${target.username}**!`
      )
      .setTimestamp();

    if (gifUrl && gifUrl.trim() !== "") {
      embed.setImage(gifUrl);
    } else {
      // Tùy chọn: Bạn có thể đặt một ảnh mặc định hoặc bỏ qua
      console.warn("Không tìm thấy GIF hợp lệ, gửi embed không có ảnh.");
    }

    await message.channel.send({ embeds: [embed] });
  },
};
