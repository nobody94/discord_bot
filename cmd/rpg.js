const { EmbedBuilder } = require("discord.js");
const { getKey, setKey, addKey, renderKey } = require("../utils/db");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { addMoney, getIcon } = require("../utils/currency");

// --- CHỐNG SPAM ---
const cooldowns = new Map();

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
      rewardMora: 80000,
      rewardGems: 10,
      desc: "Săn 20 lần (hunt)",
      type: "hunt",
    },
    {
      id: "h2",
      name: "Thợ săn lành nghề",
      target: 40,
      rewardMora: 150000,
      rewardGems: 30,
      desc: "Săn 40 lần (hunt)",
      type: "hunt",
    },
    {
      id: "h3",
      name: "Vua săn mồi",
      target: 80,
      rewardMora: 300000,
      rewardGems: 70,
      desc: "Săn 80 lần (hunt)",
      type: "hunt",
    },
  ],

  battle: [
    {
      id: "b1",
      name: "Chiến binh tinh nhuệ",
      target: 10,
      rewardMora: 200000,
      rewardGems: 20,
      desc: "Thắng 10 trận (battle)",
      type: "battle",
    },
    {
      id: "b2",
      name: "Chiến binh bất bại",
      target: 30,
      rewardMora: 500000,
      rewardGems: 40,
      desc: "Thắng 30 trận (battle)",
      type: "battle",
    },
    {
      id: "b3",
      name: "Huyền thoại chiến trường",
      target: 50,
      rewardMora: 800000,
      rewardGems: 80,
      desc: "Thắng 50 trận (battle)",
      type: "battle",
    },
  ],

  dungeon: [
    {
      id: "d1",
      name: "Kẻ chinh phục Phó bản",
      target: 5,
      rewardMora: 300000,
      rewardGems: 50,
      desc: "Vượt 5 lần Phó bản (dungeon)",
      type: "dungeon",
    },
    {
      id: "d2",
      name: "Nhà thám hiểm Phó bản",
      target: 15,
      rewardMora: 800000,
      rewardGems: 100,
      desc: "Vượt 15 lần Phó bản (dungeon)",
      type: "dungeon",
    },
    {
      id: "d3",
      name: "Bá chủ Phó bản",
      target: 30,
      rewardMora: 1000000,
      rewardGems: 200,
      desc: "Vượt 30 lần Phó bản (dungeon)",
      type: "dungeon",
    },
  ],
};


const getRequiredXP = (level) => Math.floor(Math.pow(level, 1.5) * 100);
const getVietnamRPGDay = () =>
  new Date(new Date().getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

module.exports = {
  name: "rpg",
  description: "Hệ thống RPG - Thông báo kỹ năng & chiến đấu",

  async execute(message, args) {
    const userId = message.author.id;
    const key = await renderKey("rpg_user", userId);
    const subCommand = args[0]?.toLowerCase();
    let user = await getKey(key);
    const iconMora = getIcon("mora");
    const iconPrimo = getIcon("primo");
    const todayStr = getVietnamRPGDay();

    if (!subCommand) {
      if (user?.data?.element)
        return this.showProfile(message, user.data, todayStr);
      return message.reply("Vui lòng chọn hệ trước bằng `.rpg choose [key]`");
    }

    if (subCommand === "choose") {
      if (user?.data?.element)
        return message.reply(`${errorIcon} | Bạn đã chọn hệ rồi!`);
      const choice = args[1]?.toLowerCase();
      const el = ELEMENTS_CONFIG[choice];
      if (!el) return message.reply(`${errorIcon} | Hệ không tồn tại!`);
      await setKey(key, {
        data: {
          element: el.name,
          level: 1,
          xp: 0,
          atk: el.stats.atk,
          hp: el.stats.hp,
          skill: el.skill,
          quest: null,
        },
      });
      return message.reply(
        `${verifyIcon} | Gia nhập hệ **${el.name}** thành công!`
      );
    }

    if (!user?.data) return message.reply(`${errorIcon} | Hãy chọn hệ trước!`);
   
    // --- KIỂM TRA CHỐNG SPAM (30 GIÂY) ---
    const actionCommands = ["hunt", "battle", "dungeon"];
    if (actionCommands.includes(subCommand)) {
      const lastAction = cooldowns.get(userId);
      const now = Date.now();
      const cooldownTime = 30 * 1000; // 30 giây

      if (lastAction && now - lastAction < cooldownTime) {
        const remaining = Math.ceil((cooldownTime - (now - lastAction)) / 1000);
        return message.reply(`${errorIcon} | Bạn đang mệt, vui lòng nghỉ ngơi **${remaining} giây** nữa.`);
      }
      cooldowns.set(userId, now);
    }

     // Lấy kỹ năng của người chơi dựa trên hệ
    const userSkill = user.data.skill || "Đòn đánh thường";

    // --- HUNT ---
    if (subCommand === "hunt") {
      const xp = Math.floor(Math.random() * 15) + 10;
      await addKey(`${key}.data.xp`, xp);
      if (
        user.data.quest?.type === "hunt" &&
        user.data.quest.current < user.data.quest.target
      ) {
        await addKey(`${key}.data.quest.current`, 1);
      }
      const msg = `🏹 **${message.author.username}** đã dùng **[${userSkill}]** tiêu diệt lợn rừng và nhận được **${xp} XP**.`;
      return this.checkLevelUp(message, key, msg);
    }

    // --- BATTLE ---
    if (subCommand === "battle") {
      if (user.data.level < 10)
        return message.reply(
          `${errorIcon} | Cần cấp **10** để sử dụng Battle!`
        );
      const monsters = [
        "Slime Khổng Lồ",
        "Hilichurl Thủ Lĩnh",
        "Pháp Sư Vực Thẳm",
      ];
      const target = monsters[Math.floor(Math.random() * monsters.length)];
      const win = Math.random() > 0.3;
      if (win) {
        const xp = Math.floor(Math.random() * 50) + 50;
        await addKey(`${key}.data.xp`, xp);
        if (
          user.data.quest?.type === "battle" &&
          user.data.quest.current < user.data.quest.target
        ) {
          await addKey(`${key}.data.quest.current`, 1);
        }
        const msg = `⚔️ **${message.author.username}** đã triển khai **[${userSkill}]**, đánh bại **${target}** và nhận được **${xp} XP**!`;
        return this.checkLevelUp(message, key, msg);
      }
      return message.reply(
        `💀 **${message.author.username}** đã bị **${target}** đánh bại dù đã cố dùng **${userSkill}**...`
      );
    }

    // --- DUNGEON ---
    if (subCommand === "dungeon") {
      if (user.data.level < 20)
        return message.reply(
          `${errorIcon} | Cần cấp **20** để sử dụng Dungeon!`
        );

      const monsters = [
        "Thực Thể Bóng Đêm",
        "Vong Linh Vực Sâu",
        "Hắc Linh Thức Tỉnh",
      ];
      const target = monsters[Math.floor(Math.random() * monsters.length)];

      const win = Math.random() > 0.5;
      if (win) {
        const xp = Math.floor(Math.random() * 50) + 50;
        await addKey(`${key}.data.xp`, xp);
        if (
          user.data.quest?.type === "dungeon" &&
          user.data.quest.current < user.data.quest.target
        ) {
          await addKey(`${key}.data.quest.current`, 1);
        }
        const msg = `⚔️ **${message.author.username}** đã triển khai **[${userSkill}]**, đánh bại **${target}** và nhận được **${xp} XP**!`;
        return this.checkLevelUp(message, key, msg);
      }
      return message.reply(
        `💀 **${message.author.username}** đã bị **${target}** đánh bại dù đã cố dùng **${userSkill}**...`
      );
    }

    // --- CÁC LỆNH KHÁC (Daily, Claim...) ---
    if (subCommand === "daily") {
      if (!user.data.quest || user.data.quest.date !== todayStr) {
        let pool = [...QUESTS.hunt];
        if (user.data.level >= 10) pool = pool.concat(QUESTS.battle);
        if (user.data.level >= 20) pool = pool.concat(QUESTS.dungeon);
        const randomQ = pool[Math.floor(Math.random() * pool.length)];
        await setKey(`${key}.data.quest`, {
          ...randomQ,
          current: 0,
          date: todayStr,
          claimed: false,
        });
        user.data.quest = randomQ;
      }
      const q = user.data.quest;
      const embed = new EmbedBuilder()
        .setTitle(`📜 NHIỆM VỤ: ${q.name}`)
        .setDescription(q.desc)
        .addFields(
          {
            name: "Tiến độ",
            value: `📊 \`${q.current}/${q.target}\``,
            inline: true,
          },
          {
            name: "Thưởng",
            value: `💰 \`${q.rewardMora.toLocaleString()}\` ${iconMora}\n✨ \`${
              q.rewardGems
            }\` ${iconPrimo}`,
            inline: true,
          }
        )
        .setColor(q.current >= q.target ? 0x00ff00 : 0xffff00);
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === "claim") {
      const q = user.data.quest;
      if (!q || q.date !== todayStr || q.current < q.target || q.claimed)
        return message.reply(`${errorIcon} | Không thể nhận thưởng!`);
      await addMoney(userId, q.rewardMora, "mora");
      await addMoney(userId, q.rewardGems, "primo");
      await setKey(`${key}.data.quest.claimed`, true);
      return message.reply(
        `${verifyIcon} | **${message.author.username}** đã nhận thưởng nhiệm vụ thành công!`
      );
    }
  },

  async checkLevelUp(message, key, originalMsg) {
    const updated = await getKey(key);
    const reqXP = getRequiredXP(updated.data.level);
    if (updated.data.xp >= reqXP) {
      const newLevel = updated.data.level + 1;
      await setKey(`${key}.data.level`, newLevel);
      await setKey(`${key}.data.xp`, updated.data.xp - reqXP);
      await addKey(`${key}.data.atk`, 7);
      await addKey(`${key}.data.hp`, 25);
      let lvMsg = `\n🎊 **CHÚC MỪNG!** **${message.author.username}** đã đột phá lên cấp **${newLevel}**!`;
      return message.reply((originalMsg || "") + lvMsg);
    }
    if (originalMsg) return message.reply(originalMsg);
  },

  async showProfile(message, d, todayStr) {
    const elConfig = Object.values(ELEMENTS_CONFIG).find(
      (e) => e.name === d.element
    );
    const reqXP = getRequiredXP(d.level);
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Thông tin Nhà Lữ Hành`)
      .setColor(elConfig?.ref || 0x2f3136)
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        {
          name: "👤 Nhà lữ hành",
          value: `**${message.author.username}**`,
          inline: true,
        },
        {
          name: "✨ Nguyên tố",
          value: `${elConfig?.emoji} ${d.element}`,
          inline: true,
        },
        { name: "⭐ Cấp độ", value: `Level ${d.level}`, inline: true },
        {
          name: "📖 Kinh nghiệm",
          value: `\`${d.xp.toLocaleString()} / ${reqXP.toLocaleString()}\` XP`,
          inline: false,
        },
        { name: "⚔️ Tấn công", value: `\`${d.atk}\``, inline: true },
        { name: "❤️ Sinh lực", value: `\`${d.hp}\``, inline: true },
        { name: "🔥 Kỹ năng", value: `**${d.skill}**`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  },
};
