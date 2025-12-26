const { EmbedBuilder } = require("discord.js");
const { getBalance, addMoney, getIcon } = require("../utils/currency");
const { verifyIcon, errorIcon } = require("../utils/icon");
const { maxAmount } = require("../utils/constant");

module.exports = {
  name: "race",
  aliases: ["duathu"],
  description: "Đặt cược vào cuộc đua thú: .race [số tiền] [số thú từ 1-5]",

  async execute(message, args) {
    const userId = message.author.id;
    const betAmount = parseInt(args[0]);
    const animalChoice = args[1]; // Lấy vị trí thú từ args[1]
    const currency = "mora";

    // 1. Kiểm tra tiền cược và lựa chọn thú
    if (isNaN(betAmount) || betAmount <= 0 || !animalChoice) {
      return message.reply(
        `${errorIcon} | Cú pháp: \`.race [số tiền] [số thú 1-5]\`\nVí dụ: \`.race 1000 2\` (đặt 1000 vào Thỏ)`
      );
    }

    const choiceIdx = parseInt(animalChoice) - 1;
    if (isNaN(choiceIdx) || choiceIdx < 0 || choiceIdx > 4) {
      return message.reply(`${errorIcon} | Vui lòng chọn thú từ số 1 đến 5.`);
    }

    // 2. Giới hạn mức đặt cược tối đa
    if (betAmount > maxAmount) {
      return message.reply(
        `${errorIcon} | Mức đặt cược tối đa là **${maxAmount}** ${getIcon(
          currency
        )}!`
      );
    }

    // 3. Kiểm tra số dư tài khoản
    const userBalance = await getBalance(userId, currency);
    if (userBalance < betAmount) {
      return message.reply(`${errorIcon} | Bạn không đủ tiền để đặt cược!`);
    }

    // Khởi tạo các "vận động viên"
    const animals = [
      { name: "Rùa", emoji: "🐢", position: 0 },
      { name: "Thỏ", emoji: "🐰", position: 0 },
      { name: "Ngựa", emoji: "🐎", position: 0 },
      { name: "Heo", emoji: "🐖", position: 0 },
      { name: "Hổ", emoji: "🐯", position: 0 },
    ];

    const chosenAnimal = animals[choiceIdx];
    const trackLength = 15;
    const finishLine = "🏁";

    // Hàm render track giúp cờ luôn thẳng hàng bên phải
    const renderTrack = () => {
      return animals
        .map((a) => {
          const passed = "-".repeat(a.position);
          const remaining = ".".repeat(trackLength - a.position);
          // Thú di chuyển ở giữa, cờ cố định bên phải
          return `|${passed}${a.emoji}${remaining}${finishLine}`;
        })
        .join("\n");
    };

    // Trừ tiền cược ngay khi bắt đầu
    await addMoney(userId, -betAmount, currency);

    let raceEmbed = new EmbedBuilder()
      .setTitle("🏇 CUỘC ĐUA ĐANG DIỄN RA!")
      .setDescription(renderTrack())
      .setColor("#3498db")
      .setFooter({
        text: `Bạn đã đặt cược: ${betAmount.toLocaleString()} ${getIcon(
          currency
        )} vào ${chosenAnimal.name} ${chosenAnimal.emoji}`,
      });

    const raceMsg = await message.channel.send({ embeds: [raceEmbed] });

    const interval = setInterval(async () => {
      animals.forEach((a) => {
        const move = Math.floor(Math.random() * 3);
        a.position = Math.min(a.position + move, trackLength);
      });

      await raceMsg
        .edit({ embeds: [raceEmbed.setDescription(renderTrack())] })
        .catch(() => null);

      const winners = animals.filter((a) => a.position >= trackLength);
      if (winners.length > 0) {
        clearInterval(interval);

        const isWin = winners.some((w) => w.name === chosenAnimal.name);

        // Hiển thị tên tất cả những con cùng về đích (nếu có)
        const winnerNames = winners
          .map((w) => `${w.name} ${w.emoji}`)
          .join(", ");
        const winAmount = betAmount * 4;

        const resultEmbed = new EmbedBuilder()
          .setTitle(isWin ? "🎉 BẠN ĐÃ THẮNG!" : "💸 BẠN ĐÃ THUA!")
          .setColor(isWin ? "#2ecc71" : "#e74c3c")
          .setDescription(
            `Vận động viên về đích: **${winnerNames}**\n\n` +
              (isWin
                ? `Chúc mừng! Bạn nhận được **+${winAmount.toLocaleString()}** ${getIcon(
                    currency
                  )}`
                : `Rất tiếc, bạn đã mất tiền cược.`)
          );

        if (isWin) await addMoney(userId, winAmount, currency);

        message.channel.send({
          content: `<@${userId}>`,
          embeds: [resultEmbed],
        });
      }
    }, 1500);
  },
};
