const { EmbedBuilder } = require("discord.js");
const { setKey } = require("../utils/db");
const { errorIcon, verifyIcon } = require("../utils/icon.js");
const { addMoney, getIcon } = require("../utils/currency");
const { ELEMENTS_CONFIG, QUESTS } = require("../utils/rpg.js");

const getVietnamRPGDay = () =>
  new Date(new Date().getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

async function rpgHandler(args, message, key, user,userId) {
  const subCommand = args[0]?.toLowerCase();
  const todayStr = getVietnamRPGDay();
  const iconMora = getIcon("mora");
  const iconPrimo = getIcon("primo");

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
  // --- LỆNH DAILY & CLAIM
  if (subCommand === "daily") {
    // ... (Giữ nguyên code daily của bạn)
    if (!user.data.quest || user.data.quest.date !== todayStr) {
      let pool = [...QUESTS.hunt];
      if (user.data.level >= 10) pool = pool.concat(QUESTS.battle);
      if (user.data.level >= 30) pool = pool.concat(QUESTS.dungeon);
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
          value: `📊 \`${q.current ?? 0}/${q.target}\``,
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
      .setFooter({
        text: q?.claimed
          ? "Bạn đã hoàn thành và nhận thưởng hôm nay"
          : "Sử dụng lệnh .rpg claim để nhận thưởng",
      })
      .setColor(q?.current >= q?.target ? 0x00ff00 : 0xffff00);
    return message.reply({ embeds: [embed] });
  }

  if (subCommand === "claim") {
    const q = user.data.quest;
    if (!q || q.date !== todayStr || q.current < q.target)
      return message.reply(`${errorIcon} | Chưa thể nhận thưởng!`);
    if (q.claimed) return message.reply(`${errorIcon} | Đã nhận rồi!`);
    await addMoney(userId, q.rewardMora, "mora");
    await addMoney(userId, q.rewardGems, "primo");
    await setKey(`${key}.data.quest.claimed`, true);
    return message.reply(`${verifyIcon} | Nhận thưởng thành công!`);
  }
}

module.exports = { rpgHandler };