const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

// Danh sách các lệnh và tag tương ứng trên API
const interactions = {
  pat: { tag: "pat", color: "#ffcc00", msg: "đã xoa đầu" },
  poke: { tag: "poke", color: "#00ccff", msg: "đã chọc" },
  bite: { tag: "bite", color: "#ff5555", msg: "đã cắn" },
  punch: { tag: "punch", color: "#880000", msg: "đã đấm" },
  bonk: { tag: "bonk", color: "#000000", msg: "đã gõ đầu" },
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
  },
  cuddle: {
    tag: "cuddle",
    color: "#FFB6C1", // Hồng nhạt (Light Pink)
    msg: "đã ôm ấp thật nồng thắm với",
  },
  lick: {
    tag: "lick",
    color: "#FF69B4", // Hồng đậm (Hot Pink)
    msg: "đã liếm",
  },
  kick: {
    tag: "kick",
    color: "#8B0000", // Đỏ đô (Dark Red)
    msg: "đã tung một cú đá sấm sét vào",
  },
  highfive: {
    tag: "highfive",
    color: "#00FF7F", // Xanh lá mùa xuân (Spring Green)
    msg: "đã đập tay cực ngầu với",
  },
  stare: {
    tag: "stare",
    color: "#4682B4", // Xanh thép (Steel Blue)
    msg: "đang nhìn chằm chằm (phán xét) vào",
  },
  bully: {
    tag: "bully",
    color: "#4B0082", // Màu chàm (Indigo)
    msg: "đang bắt nạt",
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
