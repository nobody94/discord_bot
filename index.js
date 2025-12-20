require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");

const express = require('express');
const app = express();
app.get('/', (req, res) => {
  console.log('--- Có tín hiệu Ping từ UptimeRobot! ---');
  res.send('Server is running!');
});
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot ${c.user.tag} READY`);
});

client.login(process.env.BOT_TOKEN)
  .then(() => console.log("🔑 Login OK"))
  .catch(err => console.error("❌ LOGIN FAIL:", err));
