const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  EmbedBuilder
} = require("discord.js");

const {
  getBalance,
  addMoney,
  removeMoney,
  currencyIcon,
} = require("../utils/currency");

// --- CẤU HÌNH VÒNG ĐẤU ---
const BETTING_TIME = 40; // Thời gian đặt cược (giây)
const ROLLING_TIME = 5; // Thời gian quay xúc xắc (giây)

// Tạm thời lưu trữ lựa chọn của người dùng cho đến khi họ nhập số tiền
const userBetState = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// State quản lý vòng đấu hiện tại
const currentRound = {
  message: null, // Tin nhắn chứa game (để chỉnh sửa)
  status: "inactive", // 'betting', 'rolling', 'inactive'
  bets: new Map(), // Map<userId, { choice: string, amount: number, username: string }>
  endTime: 0, // Thời điểm kết thúc đặt cược (timestamp)
  confirmationMsgIds: [],
};

// Hàm tung xúc xắc và tính toán kết quả
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

function getChoiceLabel(choice) {
  const choiceLabel =
    {
      tai: "Tài",
      xiu: "Xỉu",
      chan: "Chẵn",
      le: "Lẻ",
    }[choice] || choice.toUpperCase();
  return choiceLabel;
}

// Hàm xử lý kết thúc vòng đấu (sau 40s)
async function finishRound(message) {
  // 1. Vô hiệu hóa các nút trên tin nhắn game
  const components = message.components.map((row) => {
    return new ActionRowBuilder().addComponents(
      row.components.map((button) =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    );
  });

  await message
    .edit({
      content: "🛑 **HẾT GIỜ ĐẶT CƯỢC!** 🛑\nĐang tiến hành tung xúc xắc...",
      components: components,
    })
    .catch(console.error);

  // 2. Kiểm tra cược
  if (currentRound.bets.size === 0) {
    currentRound.status = "inactive";
    return message.channel.send(
      "⏱️ | Hết giờ! Không có người chơi nào đặt cược trong vòng này."
    );
  }

  currentRound.status = "rolling";
  //  XÓA TIN NHẮN XÁC NHẬN ĐẶT CƯỢC (trước khi roll) ---
  const msgIdsToDelete = currentRound.confirmationMsgIds;
  if (msgIdsToDelete.length > 0) {
      // Sử dụng bulk delete (xóa hàng loạt) để xóa nhanh các tin nhắn xác nhận
      await message.channel.bulkDelete(msgIdsToDelete, true)
          .then(deleted => console.log(`Đã xóa ${deleted.size} tin nhắn xác nhận cược.`))
          .catch(error => console.error("LỖI XÓA TIN NHẮN XÁC NHẬN:", error));
      currentRound.confirmationMsgIds = []; // Dọn dẹp mảng
  }

  // 3. Tiến hành Rolling Animation (cho toàn bộ game)
  const rollingSymbols = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const interval = 500;
  let elapsed = 0;

  while (elapsed < ROLLING_TIME * 1000) {
    const currentRolls = [
      rollingSymbols[Math.floor(Math.random() * 6)],
      rollingSymbols[Math.floor(Math.random() * 6)],
      rollingSymbols[Math.floor(Math.random() * 6)],
    ];

    const remainingSeconds = ROLLING_TIME - Math.floor(elapsed / 1000);

    await message
      .edit({
        content:
          `🎲 **KẾT QUẢ ĐANG ĐƯỢC XÁC ĐỊNH!** 🎲\n\n` +
          `[ ${currentRolls.join(" | ")} ]\n\n` +
          `Xúc xắc đang quay... (Còn **${remainingSeconds}** giây)`,
        components: components, // Giữ nút bị vô hiệu hóa
      })
      .catch(console.error);

    await delay(interval);
    elapsed += interval;
  }

  // 4. Tung xúc xắc và xử lý kết quả cho TẤT CẢ người chơi
  const { rolls, total, result, isTriple, isEven } = rollDice();

  let resultMessage = `🎲 **KẾT QUẢ TÀI XỈU** 🎲\n`;
  resultMessage += `Đã tung ra: ${rolls.join(
    " - "
  )} (Tổng: **${total}**) \n **${
    isTriple ? "BÃO" : result.toUpperCase() + " | " + (isEven ? "CHẴN" : "LẺ")
  }**\n\n`;
  resultMessage += `**CHI TIẾT VÒNG ĐẤU:**\n`;

  let winCount = 0;
  let loseCount = 0;
  const winMultiplier = 2; // Tỷ lệ 1:1 (nhận lại 2x tiền cược, lời 1x)

  // Xử lý cược
  for (const [userId, bet] of currentRound.bets) {
    const { choice, amount, username } = bet;
    let winAmount = 0;
    let outcomeText = "";

    if (isTriple) {
      // TRƯỜNG HỢP BÃO: Tất cả cược Tài/Xỉu/Chẵn/Lẻ đều thua
      outcomeText = `(BÃO) - Mất ${amount} ${currencyIcon}`;
      loseCount++;
    } else if (choice === result) {
      // Tài/Xỉu Thắng
      winAmount = amount * winMultiplier;
      await addMoney(userId, winAmount);
      outcomeText = `(Thắng) - Nhận ${amount} ${currencyIcon}`;
      winCount++;
    } else if (choice === "chan" && isEven) {
      // Chẵn Thắng
      winAmount = amount * winMultiplier;
      await addMoney(userId, winAmount);
      outcomeText = `(Thắng) - Nhận ${amount} ${currencyIcon}`;
      winCount++;
    } else if (choice === "le" && !isEven) {
      // Lẻ Thắng
      winAmount = amount * winMultiplier;
      await addMoney(userId, winAmount);
      outcomeText = `(Thắng) - Nhận ${amount} ${currencyIcon}`;
      winCount++;
    } else {
      // Thua
      outcomeText = `(Thua) - Mất ${amount} ${currencyIcon}`;
      loseCount++;
    }

    resultMessage += `> **${username}** cược **${amount}** ${currencyIcon} vào **${getChoiceLabel(
      choice
    )}**: ${outcomeText}\n`;
  }

  // resultMessage += `\n**TỔNG:** ${currentRound.bets.size} cược. ${winCount} Thắng, ${loseCount} Thua.`;

  // 5. Cập nhật tin nhắn với kết quả cuối cùng và dọn dẹp
  await message
    .edit({ content: resultMessage, components: [] })
    .catch(console.error);

  currentRound.status = "inactive";
  currentRound.bets.clear();
  currentRound.message = null;
}

// Xử lý sự kiện nhấn nút
async function handleButton(interaction) {
  if (!interaction.isButton()) return;

  // Kiểm tra trạng thái game
  if (currentRound.status !== "betting") {
    return interaction.reply({
      content: "❌ | Đã hết thời gian đặt cược hoặc vòng đấu chưa bắt đầu.",
      ephemeral: true,
    });
  }

  const userId = interaction.user.id;
  const choice = interaction.customId.split("_")[1]; // Lấy 'tai', 'xiu', 'chan' hoặc 'le'
  const choiceLabel = getChoiceLabel(choice);

  // 1. Lưu lựa chọn vào state tạm thời
  userBetState.set(userId, choice);

  // 2. Tạo Modal
  const modal = new ModalBuilder()
    .setCustomId(`taixiu_bet_modal_${Date.now()}_${userId}`)
    .setTitle(`Đặt cược ${choiceLabel}`);

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

// Xử lý sự kiện Modal Submit (khi người dùng nhập số tiền)
async function handleModalSubmit(interaction) {
  if (interaction.type !== InteractionType.ModalSubmit) return;

  let isDeferred = false;

  try {
    // 1. NGAY LẬP TỨC PHẢN HỒI (DEFER)
    await interaction.deferReply();
    isDeferred = true;

    const userId = interaction.user.id;
    const choice = userBetState.get(userId);

    // Kiểm tra trạng thái game
    if (currentRound.status !== "betting") {
      userBetState.delete(userId);
      return interaction.editReply({
        content: "❌ | Đã hết thời gian đặt cược hoặc vòng đấu chưa bắt đầu.",
      });
    }

    let responseContent = "";
    let isError = false;

    // 2. Lấy giá trị và kiểm tra logic
    const betInput = interaction.fields.getTextInputValue("betAmountInput");
    let betAmount = Number(betInput);
    betAmount = Math.floor(betAmount);
    userBetState.delete(userId);

    // Các kiểm tra lỗi khác... (Giữ nguyên logic của bạn)
    if (!choice || isNaN(betAmount) || betAmount <= 0) {
      responseContent =
        "❌ | Lựa chọn hoặc số tiền cược không hợp lệ. Giao dịch bị hủy.";
      isError = true;
    } else if (currentRound.bets.has(userId)) {
      responseContent = `❌ | Bạn đã đặt cược **${
        currentRound.bets.get(userId).amount
      }** ${currencyIcon} vào **${getChoiceLabel(
        currentRound.bets.get(userId).choice
      )}** trong vòng này. Bạn chỉ được cược một lần.`;
      isError = true;
    } else {
      const currentBalance = await getBalance(userId);
      if (betAmount > currentBalance) {
        responseContent = `💸 | Bạn không có đủ **${betAmount}** ${currencyIcon}. Số dư hiện tại: **${currentBalance}** ${currencyIcon}.`;
        isError = true;
      } else {
        // Trừ tiền cược
        const success = await removeMoney(userId, betAmount);
        if (!success) {
          responseContent =
            "❌ | Có lỗi xảy ra khi trừ tiền của bạn. Vui lòng kiểm tra số dư.";
          isError = true;
        } else {         
          // 1. Lưu cược vào state
          currentRound.bets.set(userId, {
            choice: choice,
            amount: betAmount,
            username: interaction.user.globalName || interaction.user.username,
          });

          // 2. Xóa phản hồi defer ephemeral ban đầu (tin nhắn "Bot đang làm việc...")
          await interaction.deleteReply().catch(console.error);

          // 3. Gửi tin nhắn xác nhận KHÔNG PHẢI ephemeral
          const successMsg = `✅ **[${currentRound.bets.size}]** ${
            interaction.user.globalName || interaction.user.username
          } đã đặt cược **${betAmount}** ${currencyIcon} vào **${getChoiceLabel(choice)}**.`;
          const confirmMessage = await interaction.followUp({
            content: successMsg,
            ephemeral: false, // RẤT QUAN TRỌNG: Không phải ephemeral để bot xóa được
          });

          // 4. LƯU ID TIN NHẮN vào mảng chung
          currentRound.confirmationMsgIds.push(confirmMessage.id);

          // 5. Kết thúc hàm tại đây.
          return;
        }
      }
    }

    // 3. Phản hồi cuối cùng (sử dụng editReply)
    // await interaction.editReply({ content: responseContent });
    if (isError) {
      // Dùng followUp nếu có lỗi, vì đôi khi editReply sau defer lỗi
      await interaction.followUp({ content: responseContent, ephemeral: true });
    } else {
      // Chỉ editReply nếu thành công (để không tạo thêm tin nhắn)
      await interaction.editReply({ content: responseContent });
    }
  } catch (error) {
    console.error("LỖI XỬ LÝ ĐẶT CƯỢC TÀI XỈU:", error);
    const errorMessage = `❌ Đã xảy ra lỗi nghiêm trọng trong quá trình đặt cược! Lỗi: ${error.message}`;

    // Nếu deferReply đã thành công, chúng ta cố gắng editReply lần cuối.
    // Nếu không, chúng ta dùng followUp.
    if (isDeferred) {
      await interaction
        .editReply({ content: errorMessage })
        .catch(async (e) => {
          // Nếu editReply vẫn lỗi (lỗi "InteractionAlreadyReplied" xảy ra ở đây)
          // thì dùng followUp để gửi tin nhắn mới
          console.error(
            "LỖI KHÔNG THỂ EDIT REPLY SAU DEFER. THỬ FOLLOW-UP:",
            e
          );
          await interaction
            .followUp({ content: errorMessage, ephemeral: true })
            .catch(console.error);
        });
    } else {
      // Nếu không defer được ngay từ đầu (rất hiếm)
      await interaction
        .reply({ content: errorMessage, ephemeral: true })
        .catch(console.error);
    }
  }
}

module.exports = {
  name: "taixiu",
  description: "Đặt Tài/Xỉu/Chẵn/Lẻ",
  aliases: ["tx"],
  // State và hàm xử lý được export
  userBetState,
  handleButton,
  handleModalSubmit,

  // Hàm execute ban đầu: Bắt đầu game và timer 40s
  async execute(message, args) {
    // 1. Kiểm tra vòng đấu đang hoạt động
    if (currentRound.status !== "inactive") {
      return message.channel.send(
        "❌ | Vòng Tài Xỉu hiện tại đang diễn ra. Vui lòng đợi kết thúc."
      );
    }    

    // 2. Thiết lập trạng thái vòng đấu mới
    currentRound.status = "betting";
    currentRound.bets.clear();
    currentRound.confirmationMsgIds = [];
    currentRound.endTime = Date.now() + BETTING_TIME * 1000;

    // 3. Tạo các nút (giống hệt code gốc)
    const taiButton = new ButtonBuilder()
      .setCustomId("tx_tai")
      .setLabel("Đặt Tài (11-17)")
      .setStyle(ButtonStyle.Success);

    const xiuButton = new ButtonBuilder()
      .setCustomId("tx_xiu")
      .setLabel("Đặt Xỉu (4-10)")
      .setStyle(ButtonStyle.Success);

    const chanButton = new ButtonBuilder()
      .setCustomId("tx_chan")
      .setLabel("Đặt CHẴN")
      .setStyle(ButtonStyle.Danger);

    const leButton = new ButtonBuilder()
      .setCustomId("tx_le")
      .setLabel("Đặt LẺ")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(taiButton, xiuButton);
    const row2 = new ActionRowBuilder().addComponents(chanButton, leButton);
    const allComponents = [row1, row2];

    const initialEmbed = new EmbedBuilder()
        .setColor(0x0099ff) 
        .setTitle('🎲 **Tài Xỉu Nobody - Nhà cái đến từ Teyvat!** 🎲')
        .setDescription(`Chọn Tài, Xỉu , Chẵn/Lẻ để đặt cược.\nSau khi chọn, nhập số gold bạn muốn cược\nNếu bot dừng, hãy sử dụng lại lệnh để tiếp tục ván chơi\nTrò chơi sẽ bắt đầu ngay lập tức và đếm ngược 40 giây.`)

    await message.channel.send({embeds:[initialEmbed],components: allComponents})

    // 4. Gửi tin nhắn nút và lưu lại
    const initialContent = `Nhấn nút lựa chọn của bạn: CÒN ${BETTING_TIME} GIÂY ĐẶT CƯỢC`;
    const gameMessage = await message.channel.send({
      content: initialContent,
    });
    currentRound.message = gameMessage;

    // 5. Bắt đầu vòng lặp đếm ngược 40 giây (và cập nhật tin nhắn)
    let remainingTime = BETTING_TIME;

    while (remainingTime > 0 && currentRound.status === "betting") {
      const title = `Nhấn nút lựa chọn của bạn: CÒN ${remainingTime} GIÂY ĐẶT CƯỢC`;

      await gameMessage
        .edit({
          content: `${title}`,
        })
        .catch(console.error); // Xử lý lỗi nếu bot mất quyền chỉnh sửa

      await delay(1000);
      remainingTime--;
    }

    // 6. Kết thúc vòng đấu
    if (currentRound.status === "betting") {
      await finishRound(gameMessage);
    }
  },
};
