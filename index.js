require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot ${c.user.tag} READY`);
});

client.login(process.env.BOT_TOKEN)
  .then(() => console.log("🔑 Login OK"))
  .catch(err => console.error("❌ LOGIN FAIL:", err));
