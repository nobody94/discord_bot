const { EmbedBuilder } = require("discord.js");
const { getKey, setKey, addKey, renderKey } = require("../utils/db");
const { errorIcon } = require("../utils/icon.js");
const { ELEMENTS_CONFIG } = require("../utils/rpg.js");
const { rpgHandler } = require("../game/rpgHandler.js");

// --- CHỐNG SPAM ---
const cooldowns = new Map();

const getRequiredXP = (level) => Math.floor(Math.pow(level, 1.5) * 100);

module.exports = {
  name: "rpg",
  description: "Hệ thống RPG",

  async execute(message, args) {
    const userId = message.author.id;
    const key = await renderKey("rpg_user", userId);
    const subCommand = args[0]?.toLowerCase();
    let user = await getKey(key);
      
    if (!subCommand) {
      if (user && user.data && user.data.element) {
        return this.showProfile(message, user.data);
      }
      // ... (Phần hiển thị chọn hệ giữ nguyên)
      const embed = new EmbedBuilder()
        .setTitle("⚔️ KHÁM PHÁ NGUYÊN TỐ")
        .setDescription("Chọn hệ để bắt đầu: `.rpg choose [key]`\n")
        .setColor(0x2f3136);

      Object.keys(ELEMENTS_CONFIG).forEach((id) => {
        const el = ELEMENTS_CONFIG[id];
        embed.addFields({
          name: `${el.emoji} Hệ ${el.name}`,
          value: `Key: ${id}\nATK: ${el.stats.atk} | HP: ${el.stats.hp}`,
          inline: true,
        });
      });
      return message.reply({ embeds: [embed] });
    }

    const isHandled = await rpgHandler(args, message, key, user,userId);
    if (isHandled) return;

    if (!user?.data) return message.reply(`${errorIcon} | Hãy chọn hệ trước!`);
      
      // 1. XỬ LÝ SỐ LẦN ĐÁNH (args[1]) - Mặc định 1, tối đa 5
    let times = parseInt(args[1]) || 1;
     if (times < 1) { times = 1; }
      
      if(!user.data.quest && times > 1){
          times = 1
      }

    if((user.data?.quest?.current == user.data?.quest?.target || user.data?.quest?.claimed) && times > 1 || user.data?.quest?.type !== subCommand){
      times = 1
    }

    if(user.data?.quest?.current < user.data?.quest?.target){
      if(times > (user.data.quest.target / 2)){
        times = user.data.quest.target / 2
      }
    }   

    // --- KIỂM TRA COOLDOWN ĐỘNG ---
    const actionCommands = ["hunt", "battle", "dungeon"];
    if (actionCommands.includes(subCommand)) {
      const lastAction = cooldowns.get(`${userId}_${subCommand}`);
      const now = Date.now();

      // Kiểm tra dựa trên giới hạn (limit) của lần đánh TRƯỚC ĐÓ
      if (lastAction) {
        const elapsed = now - lastAction.time;
        if (elapsed < lastAction.limit) {
          const remaining = Math.ceil((lastAction.limit - elapsed) / 1000);
          let timeText =
            remaining >= 60
              ? `**${Math.floor(remaining / 60)} phút ${remaining % 60} giây**`
              : `**${remaining} giây**`;

          return message
            .reply(
              `${errorIcon} | Bạn vẫn đang trong thời gian hồi sức! Chờ thêm ${timeText}.`
            )
            .then((msg) =>
              setTimeout(() => msg.delete().catch(() => null), 5000)
            );
        }
      }

      // Thiết lập Cooldown mới cho lượt NÀY
      const currentLimit = times > 1 ? 240000 : 30000; // Đánh nhanh 4p, lẻ 30s
      cooldowns.set(`${userId}_${subCommand}`, {
        time: now,
        limit: currentLimit,
      });
    }

    const userSkill = user.data.skill || "Đòn đánh thường";
    let totalXP = 0;
    let wins = 0;
    let losses = 0;
    const difficultyMultiplier = 1 + (times - 1) * 0.1; // Tăng tỉ lệ thua khi đánh nhiều

    // --- XỬ LÝ LOGIC CHIẾN ĐẤU ---
    if (subCommand === "hunt") {
      for (let i = 0; i < times; i++) {
        // Tỉ lệ thắng cơ bản của Hunt là 95%, giảm dần nếu đánh nhiều lần
        const winChance = 0.95;

        if (Math.random() < winChance) {
          const xp = Math.floor(Math.random() * 8) + 8;
          totalXP += xp;
          wins++;

          // Cập nhật tiến độ nhiệm vụ nếu có
          if (
            user.data.quest?.type === "hunt" &&
            user.data.quest.current < user.data.quest.target
          ) {
            user.data.quest.current += 1;
            await setKey(`${key}.data.quest.current`, user.data.quest.current);
          }
        } else {
          losses++;
        }
      }

      await addKey(`${key}.data.xp`, totalXP);

      // Thông báo kết quả có sử dụng userSkill
      let huntResult = `🏹 **${message.author.username}** đã sử dụng **${userSkill}** để đi săn **${times}** hiệp:\n`;
      huntResult += `🔥 Thắng: **${wins}** | 💀 Thua: **${losses}**\n✨ Tổng XP nhận được: **+${totalXP}**`;

      if (losses > 0) {
        huntResult += `\n*(Do đánh nhanh, một số con thú đã chạy thoát hoặc phản công khiến bạn thất bại!)*`;
      }

      return this.checkLevelUp(message, key, huntResult);
    }

    if (subCommand === "battle") {
      if (user.data.level < 10)
        return message.reply(`${errorIcon} | Cần cấp **10** để Battle!`);

      for (let i = 0; i < times; i++) {
        const winChance = 0.7; // Giảm tỉ lệ thắng
        if (Math.random() < winChance) {
          const xp =
            user.data.level < 20
              ? Math.floor(Math.random() * 15) + 15
              : Math.floor(Math.random() * 30) + 30;
          totalXP += xp;
          wins++;
          if (user.data.quest?.type === "battle")
            await addKey(`${key}.data.quest.current`, 1);
        } else {
          losses++;
        }
      }
      await addKey(`${key}.data.xp`, totalXP);
      const resMsg = `**${message.author.username}** đã sử dụng ${userSkill} để đánh quái\n⚔️ **KẾT QUẢ BATTLE (${times} LẦN)**\n🔥 Thắng: ${wins} | 💀 Thua: ${losses}\n✨ Tổng XP: +${totalXP}`;
      return this.checkLevelUp(message, key, resMsg);
    }

    if (subCommand === "dungeon") {
      if (user.data.level < 30)
        return message.reply(`${errorIcon} | Cần cấp **30** để Dungeon!`);

      for (let i = 0; i < times; i++) {
        const winChance = 0.5; // Dungeon cực khó khi đánh nhanh
        if (Math.random() < winChance) {
          const xp = Math.floor(Math.random() * 50) + 50;
          totalXP += xp;
          wins++;
          if (user.data.quest?.type === "dungeon")
            await addKey(`${key}.data.quest.current`, 1);
        } else {
          losses++;
        }
      }
      await addKey(`${key}.data.xp`, totalXP);
      const resMsg = `**${message.author.username}** đã sử dụng ${userSkill} để đánh quái\n🏰 **KẾT QUẢ DUNGEON (${times} LẦN)**\n🔥 Thắng: ${wins} | 💀 Thua: ${losses}\n✨ Tổng XP: +${totalXP}`;
      return this.checkLevelUp(message, key, resMsg);
    }
  },

  async checkLevelUp(message, key, originalMsg) {
    const updated = await getKey(key);
    if (updated.data.level >= 60) return message.reply(originalMsg);

    const reqXP = getRequiredXP(updated.data.level);
    if (updated.data.xp >= reqXP) {
      const newLevel = updated.data.level + 1;
      await setKey(`${key}.data.level`, newLevel);
      await setKey(`${key}.data.xp`, updated.data.xp - reqXP);
      await addKey(`${key}.data.atk`, 7);
      await addKey(`${key}.data.hp`, 25);
      let lvMsg = `\n🎊 **LEVEL UP!** Bạn đã đạt cấp **${newLevel}**!`;
      return message.reply(originalMsg + lvMsg);
    }
    return message.reply(originalMsg);
  },

  async showProfile(message, d) {
    const elConfig = Object.values(ELEMENTS_CONFIG).find(
      (e) => e.name === d.element
    );
    const reqXP = getRequiredXP(d.level);
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Thông tin Nhà Lữ Hành`)
      .setColor(elConfig?.ref || 0x2f3136)
      .addFields(
        {
          name: "👤 Tên",
          value: `**${message.author.username}**`,
          inline: true,
        },
        {
          name: "✨ Hệ",
          value: `${elConfig?.emoji} ${d.element}`,
          inline: true,
        },
        { name: "⭐ Cấp", value: `Level ${d.level}`, inline: true },
        {
          name: "📖 XP",
          value: `\`${d.xp.toLocaleString()} / ${reqXP.toLocaleString()}\``,
          inline: false,
        },
        { name: "⚔️ ATK", value: `\`${d.atk}\``, inline: true },
        { name: "❤️ HP", value: `\`${d.hp}\``, inline: true }
      );
    return message.reply({ embeds: [embed] });
  },
};
