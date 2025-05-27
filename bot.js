import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_STATUS_URL = process.env.CONNECT_URL;

if (!TOKEN || !CHANNEL_ID || !SERVER_STATUS_URL) {
  console.error('Missing environment variables! Make sure BOT_TOKEN, CHANNEL_ID, and CONNECT_URL are set.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function updateStatusMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.error('Channel not found');

    const response = await fetch(SERVER_STATUS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // Extract players and max players correctly
    const maxPlayers = parseInt(data.vars?.sv_maxClients) || 0;
    const players = data.clients ?? 0;

    const status = players > 0 ? '🟢 Online' : '🔴 Offline';

    const embed = new EmbedBuilder()
      .setTitle('LAV Server Status')
      .setDescription(status)
      .addFields(
        { name: 'Players', value: `${players} / ${maxPlayers}`, inline: true }
      )
      .setImage('https://i.imgur.com/5OrBONg.png') // Server image
      .setTimestamp();

    // Fetch last 10 messages to find bot's own message
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(msg => msg.author.id === client.user.id);

    if (botMessage) {
      await botMessage.edit({ embeds: [embed] });
    } else {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Failed to fetch server data:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000); // every 15 minutes
});

client.login(TOKEN);
