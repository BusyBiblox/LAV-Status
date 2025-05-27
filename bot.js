import { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import express from 'express';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
// Use the env var, fallback to your redirect URL if not set
const CONNECT_URL = process.env.CONNECT_URL || 'https://busybiblox.github.io/LAV-Redirect/';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function updateStatusMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return console.error('Channel not found');

  const serverIsOnline = true;

  const connectButton = new ButtonBuilder()
    .setLabel('Connect to FiveM Server')
    .setStyle(ButtonStyle.Link)
    .setURL(CONNECT_URL);

  const actionRow = new ActionRowBuilder().addComponents(connectButton);

  const statusText = serverIsOnline ? 'Server is Online ✅' : 'Server is Offline ❌';

  try {
    await channel.send({ content: statusText, components: [actionRow] });
  } catch (error) {
    console.error('Error sending status message:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
