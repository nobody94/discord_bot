async function handleModalSubmit(interaction) {
  if (interaction.type !== InteractionType.ModalSubmit) return;

  const userId = interaction.user.id;
  const choice = userBetState.get(userId); 
  
  // Kiểm tra trạng thái game (sau defer trong index.js)
  if (currentRound.status !== 'betting') {
       userBetState.delete(userId); 
       return interaction.editReply({
            content: "❌ | Đã hết thời gian đặt cược hoặc vòng đấu chưa bắt đầu.",
        });
  }
  
  let responseContent = "";
  let isError = false;

  try {
    const betInput = interaction.fields.getTextInputValue("betAmountInput");
    let betAmount = Number(betInput);
    betAmount = Math.floor(betAmount);
    userBetState.delete(userId); 

    if (!choice || isNaN(betAmount) || betAmount <= 0) {
        responseContent = "❌ | Lựa chọn hoặc số tiền cược không hợp lệ. Giao dịch bị hủy.";
        isError = true;
    } else if (currentRound.bets.has(userId)) {
        responseContent = `❌ | Bạn đã đặt cược **${currentRound.bets.get(userId).amount}** ${currency} vào **${currentRound.bets.get(userId).choice.toUpperCase()}** trong vòng này. Bạn chỉ được cược một lần.`;
        isError = true;
    } else {
        const currentBalance = await getBalance(userId);
        if (betAmount > currentBalance) {
            responseContent = `💸 | Bạn không có đủ **${betAmount}** ${currency}. Số dư hiện tại: **${currentBalance}** ${currency}.`;
            isError = true;
        } else {
            // Trừ tiền cược
            const success = await removeMoney(userId, betAmount);
            if (!success) {
                responseContent = "❌ | Có lỗi xảy ra khi trừ tiền của bạn. Vui lòng kiểm tra số dư.";
                isError = true;
            } else {
                // --- THÀNH CÔNG: LƯU CƯỢC VÀ GỬI TIN NHẮN CÔNG KHAI CÓ THỂ XÓA ---
                
                // 1. Lưu cược vào state
                currentRound.bets.set(userId, {
                    choice: choice,
                    amount: betAmount,
                    username: interaction.user.globalName || interaction.user.username,
                });
                
                // 2. Xóa phản hồi defer ephemeral ban đầu (tin nhắn "Bot đang làm việc...")
                await interaction.deleteReply().catch(console.error);

                // 3. Gửi tin nhắn xác nhận KHÔNG PHẢI ephemeral
                const successMsg = `✅ **[${currentRound.bets.size}]** ${interaction.user.globalName || interaction.user.username} đã đặt cược **${betAmount}** ${currency} vào **${choice.toUpperCase()}**.`;
                const confirmMessage = await interaction.followUp({
                    content: successMsg,
                    ephemeral: false // RẤT QUAN TRỌNG: Không phải ephemeral để bot xóa được
                });
                
                // 4. LƯU ID TIN NHẮN vào mảng chung
                currentRound.confirmationMsgIds.push(confirmMessage.id);
                
                // 5. Kết thúc hàm tại đây.
                return; 
            }
        }
    }
    // --- KẾT THÚC XỬ LÝ THÀNH CÔNG ---

  } catch (error) {
    console.error("LỖI XỬ LÝ ĐẶT CƯỢC TÀI XỈU:", error);
    responseContent = `❌ Đã xảy ra lỗi nghiêm trọng trong quá trình đặt cược! Lỗi: ${error.message}`;
    isError = true;
  }
  
  // 3. Phản hồi cuối cùng (Chỉ xử lý trường hợp LỖI - vẫn là ephemeral)
  if (isError) {
      await interaction
          .editReply({ content: responseContent })
          .catch(async (e) => {
             console.error("LỖI KHÔNG THỂ EDIT REPLY. THỬ FOLLOW-UP:", e);
             await interaction.followUp({ content: responseContent, ephemeral: true }).catch(console.error);
          });
  }
}