// --- LOGIC THÂN MẬT (CẬP NHẬT) ---
    let loveNote = "";
    const guildId = message.guild.id;
    const coupleKey = renderKey("couple", guildId);
    let couplesList = (await getKey(coupleKey)) || [];
    const userId = message.author.id;

    // Tìm xem BẠN (người dùng) có đang trong mối quan hệ nào không
    const myCoupleIndex = couplesList.findIndex(
      (c) => c.husband === userId || c.wife === userId
    );

    if (myCoupleIndex !== -1) {
      const today = getCustomDate();
      const couple = couplesList[myCoupleIndex];
      const partnerId = (couple.husband === userId) ? couple.wife : couple.husband;

      // Reset điểm ngày nếu qua 4h sáng
      if (couple.lastGiftDate !== today) {
        couple.lastGiftDate = today;
        couple.dailyLovePoints = 0;
      }

      const points = config.lovePoint || 0;

      // TH 1: Tương tác với đúng bạn đời
      if (target.id === partnerId) {
          if (points < 0) {
            couple.lovePoints = (couple.lovePoints || 0) + points;
            loveNote = `\n💔 Thân mật: **${points}** (Đừng bạo lực với người ấy thế chứ!)`;
          } else if (points > 0) {
            const currentDaily = couple.dailyLovePoints || 0;
            const remaining = MAX_LOVE_POINTS_PER_DAY - currentDaily;
            if (remaining > 0) {
              const added = Math.min(points, remaining);
              couple.lovePoints = (couple.lovePoints || 0) + added;
              couple.dailyLovePoints = currentDaily + added;
              loveNote = `\n💖 Thân mật: **+${added}** điểm!`;
            }
          }
      } 
      // TH 2: Tương tác THÂN MẬT (điểm > 0) với người khác không phải bạn đời
      else if (points > 0 && target.id !== userId) {
          const penalty = -20; // Số điểm phạt
          couple.lovePoints = (couple.lovePoints || 0) + penalty;
          loveNote = `\n🔥 **Bắt quả tang!** Bạn dám **${config.tag}** người khác? \n💔 Bạn và bạn đời bị trừ **${penalty}** điểm thân mật!`;
      }

      await setKey(coupleKey, couplesList);
    }
    // --- KẾT THÚC LOGIC ---