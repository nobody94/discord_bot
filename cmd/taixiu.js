const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
} = require("discord.js");

const {
  getBalance,
  addMoney,
  removeMoney,
  currency,
} = require("../utils/currency");

// Tạm thời lưu trữ lựa chọn của người dùng cho đến khi họ nhập số tiền
const userBetState = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hàm tung xúc xắc và tính toán kết quả
function rollDice() {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const roll3 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2 + roll3;

  let result = "";
  const isTriple = roll1 === roll2 && roll2 === roll3;

  if (isTriple) {
    result = "bão";
  } else if (total >= 11 && total <= 17) {
    result = "tài";
  } else {
    result = "xỉu";
  }

  return { rolls: [roll1, roll2, roll3], total, result, isTriple };
}

// Hàm chính xử lý logic game (sẽ được gọi khi người dùng nhập số tiền)
function rollDice() {
  const roll1 = Math.floor(Math.random() * 6) + 1;
  const roll2 = Math.floor(Math.random() * 6) + 1;
  const roll3 = Math.floor(Math.random() * 6) + 1;
  const total = roll1 + roll2 + roll3;

  let result = "";
  const isTriple = roll1 === roll2 && roll2 === roll3;

  // Thêm kiểm tra Chẵn/Lẻ (trên tổng điểm)
  const isEven = total % 2 === 0;

  if (isTriple) {
    result = "bão";
  } else if (total >= 11 && total <= 17) {
    result = "tài"; // Tài: 11, 12, 13, 14, 15, 16, 17
  } else {
    result = "xỉu"; // Xỉu: 4, 5, 6, 7, 8, 9, 10
  }

  return { rolls: [roll1, roll2, roll3], total, result, isTriple, isEven };
}

// Xử lý sự kiện nhấn nút
async function handleButton(interaction) {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  const choice = interaction.customId.split("_")[1]; // Lấy 'tai' hoặc 'xiu'

  // 1. Lưu lựa chọn vào state tạm thời
  userBetState.set(userId, choice);

  // 2. Tạo Modal
  const modal = new ModalBuilder()
    .setCustomId(`taixiu_bet_modal_${Date.now()}_${userId}`) // ID Modal duy nhất, có thể dùng timestamp và UserID
    .setTitle(`Đặt cược ${choice == "tai" ? "Tài" : "Xỉu"}`);

  // 3. Tạo trường nhập liệu (Text Input)
  const betInput = new TextInputBuilder()
    .setCustomId("betAmountInput")
    .setLabel("Số tiền cược (chỉ nhập số)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ví dụ: 100")
    .setRequired(true);

  // 4. Đặt trường nhập liệu vào một hàng
  const actionRow = new ActionRowBuilder().addComponents(betInput);

  // 5. Thêm hàng vào Modal
  modal.addComponents(actionRow);

  // 6. Hiển thị Modal cho người dùng
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction) {
  if (interaction.type !== InteractionType.ModalSubmit) return;

  const userId = interaction.user.id;
  const choice = userBetState.get(userId); // Lấy lựa chọn đã lưu từ handleButton

  try {
    // 1. Lấy giá trị từ trường nhập liệu và xóa trạng thái
    const betInput = interaction.fields.getTextInputValue("betAmountInput");
    let betAmount = Number(betInput);
    betAmount = Math.floor(betAmount);
    userBetState.delete(userId);

    // 2. Kiểm tra tính hợp lệ
    if (!choice || isNaN(betAmount) || betAmount <= 0) {
      return interaction.editReply({
        content:
          "❌ | Lựa chọn hoặc số tiền cược không hợp lệ. Giao dịch bị hủy.",
        ephemeral: true,
      });
    }

    // 4. Kiểm tra số dư lần cuối
    const currentBalance = await getBalance(userId);
    if (betAmount > currentBalance) {
      return interaction.editReply(
        `💸 | Bạn không có đủ **${betAmount}** ${currency}. Số dư hiện tại: **${currentBalance}** ${currency}.`
      );
    }

    // 5. Trừ tiền cược
    const success = await removeMoney(userId, betAmount);
    if (!success) {
      return interaction.editReply(
        "❌ | Có lỗi xảy ra khi trừ tiền của bạn. Vui lòng kiểm tra số dư."
      );
    }

    //tạo xúc xắc quay
    const rollingSymbols = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]; // Các ký hiệu xúc xắc (1-6)
    const totalDuration = 3; // Thời gian quay (giây)
    const interval = 500; // Khoảng thời gian chỉnh sửa (ms)
    let elapsed = 0;

    // Gửi tin nhắn khởi tạo (sử dụng editReply lần đầu)
    await interaction.editReply({
      content:
        `🎲 **Bắt đầu Tài Xỉu!** 🎲\n**Cược:** ${betAmount} ${currency} (${choice.toUpperCase()})\n\n` +
        `Xúc xắc đang quay... (Còn ${totalDuration} giây)`,
    });

    // Vòng lặp để mô phỏng quay xúc xắc và đếm ngược
    while (elapsed < totalDuration * 1000) {
      // Tạo 3 ký hiệu xúc xắc ngẫu nhiên cho hiệu ứng quay
      const currentRolls = [
        rollingSymbols[Math.floor(Math.random() * 6)],
        rollingSymbols[Math.floor(Math.random() * 6)],
        rollingSymbols[Math.floor(Math.random() * 6)],
      ];

      const remainingSeconds = totalDuration - Math.floor(elapsed / 1000);

      // Chỉnh sửa tin nhắn để hiển thị quay và đếm ngược
      await interaction
        .editReply({
          content:
            `🎲 **Bắt đầu Tài Xỉu!** 🎲\n**Cược:** ${betAmount} ${currency} (${choice.toUpperCase()})\n\n` +
            `[ ${currentRolls.join(" | ")} ]\n\n` +
            `Xúc xắc đang quay... (Còn **${remainingSeconds}** giây)`,
        })
        .catch(console.error); // Xử lý lỗi nếu bot mất quyền chỉnh sửa

      await delay(interval);
      elapsed += interval;
    }

    // 6. Tung xúc xắc và xử lý kết quả
    const { rolls, total, result, isTriple,isEven } = rollDice();

    let resultMessage = `🎲 **KẾT QUẢ TÀI XỈU** 🎲\n`;
    resultMessage += `**Lựa chọn:** ${choice.toUpperCase()} | **Cược:** ${betAmount} ${currency}\n`;
    resultMessage += `Đã tung ra: ${rolls.join(
      " - "
    )} (Tổng: **${total}**)\n\n`;
    let outcome = "";

    if (isTriple) {
      // TRƯỜNG HỢP BÃO: Người chơi Tài/Xỉu đều thua
      outcome = `🌩️ **BÃO!** (3 con ${rolls[0]}) Kết quả này khiến **Tài và Xỉu đều thua**.\n😔 Bạn đã mất **${betAmount}** ${currency}.`;
    } else {
        // 2. Xử lý Chẵn/Lẻ
        if (choice === 'chan' && isEven) {
            outcome = `🎉 **THẮNG CHẴN!** (Tổng: ${total}). Bạn đã thắng **${betAmount}** ${currency}.`;
        } else if (choice === 'le' && !isEven) {
            outcome = `🎉 **THẮNG LẺ!** (Tổng: ${total}). Bạn đã thắng **${betAmount}** ${currency}.`;
        
        // 3. Xử lý Tài/Xỉu
        } else if (choice === result) { // result là 'tài' hoặc 'xỉu'
            outcome = `🎉 **THẮNG ${result.toUpperCase()}!** (Tổng: ${total}). Bạn đã thắng **${betAmount}** ${currency}.`;

        } else {
            // THUA (bao gồm cả trường hợp Tài/Xỉu thua và Chẵn/Lẻ thua)
            outcome = `😔 **THUA!** Kết quả là **${isEven ? 'CHẴN' : 'LẺ'}** | **${result.toUpperCase()}** (Tổng: ${total}). Bạn đã mất **${betAmount}** ${currency}.`;
            winMultiplier = 0; // Đặt về 0 để logic tính tiền chạy đúng
        }

        // 4. Tính toán tiền thắng/thua
        if (winMultiplier > 0) {
            // Chỉ chạy nếu thắng (winMultiplier = 2)
            const winAmount = betAmount * winMultiplier;
            await addMoney(userId, winAmount);
            finalBalance = currentBalance + betAmount; // Số dư mới = Số dư cũ + Tiền thắng ròng
        } else {
             // Thua hoặc Bão (đã xử lý tiền ở bước 1)
             finalBalance = currentBalance - betAmount;
        }
    }    

    // 7. Gửi kết quả
    resultMessage += outcome;

    await interaction.editReply(resultMessage);
  } catch (error) {
    console.error("LỖI XỬ LÝ TÀI XỈU:", error);
    await interaction
      .editReply(
        `❌ Đã xảy ra lỗi nghiêm trọng trong trò chơi! Lỗi: ${error.message}`
      )
      .catch((e) => {
        // Nếu ngay cả editReply cũng thất bại, in ra log.
        console.error("Không thể gửi thông báo lỗi cho người dùng:", e);
      });
  }
}

module.exports = {
  name: "taixiu",
  description: "Đặt Tài/Xỉu bằng nút và nhập số tiền.",
  aliases: ["tx"],
  //state
  userBetState,
  // Export hàm xử lý nút để xử lý trong index
  handleButton,
  handleModalSubmit,

  // Hàm execute ban đầu: Gửi tin nhắn và các nút
  async execute(message, args) {
    // 1. Tạo các nút
    const taiButton = new ButtonBuilder()
      .setCustomId("tx_tai")
      .setLabel("Đặt Tài (11-17)")
      .setStyle(ButtonStyle.Success);

    const xiuButton = new ButtonBuilder()
      .setCustomId("tx_xiu")
      .setLabel("Đặt Xỉu (4-10)")
      .setStyle(ButtonStyle.Danger);

    const chanButton = new ButtonBuilder()
      .setCustomId("tx_chan")
      .setLabel("Đặt CHẴN")
      .setStyle(ButtonStyle.Success);

    const leButton = new ButtonBuilder()
      .setCustomId("tx_le")
      .setLabel("Đặt LẺ")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(taiButton, xiuButton);
    const row2 = new ActionRowBuilder().addComponents(chanButton, leButton);

    // 2. Gửi tin nhắn nút
    message.channel.send({
      content: "🎲 **BẮT ĐẦU TÀI XỈU** 🎲\nNhấn nút lựa chọn của bạn:",
      components: [row1,row2],
    });
  },
};
