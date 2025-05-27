import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_STATUS_URL = process.env.SERVER_STATUS_URL; // Your JSON API URL

async function updateStatusMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('Channel not found');
    return;
  }

  // Fetch server data
  let data;
  try {
    const res = await fetch(SERVER_STATUS_URL);
    data = await res.json();
  } catch (err) {
    console.error('Failed to fetch server data:', err);
    return;
  }

  const maxPlayers = data.vars?.sv_maxClients || 'Unknown';
  const currentPlayers = data.resources?.length || 0; // Adjust this based on actual player count field
  const isOnline = !!data.server;

  // Find bot's message
  const messages = await channel.messages.fetch({ limit: 50 });
  let statusMessage = messages.find(msg => msg.author.id === client.user.id);

  if (!statusMessage) {
    console.log('Status message not found. Sending a new one...');
    const embed = new EmbedBuilder()
      .setTitle('Server Status')
      .setDescription('Fetching server status...')
      .setColor(0xffff00)
      .setImage('https://i.imgur.com/5OrBONg.png'); // Your image URL

    statusMessage = await channel.send({ embeds: [embed] });
    console.log('New status message sent:', statusMessage.id);
    return; // will update content on next run
  }

  // Build embed
  const embed = new EmbedBuilder()
    .setTitle('LAV Server Status')
    .setColor(isOnline ? 0x00ff00 : 0xff0000)
    .addFields(
      { name: 'Status', value: isOnline ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: 'Players', value: `${currentPlayers} / ${maxPlayers}`, inline: true },
    )
    .setImage('https://i.imgur.com/5OrBONg.png')
    .setTimestamp();

  // Edit existing message
  await statusMessage.edit({ embeds: [embed] });
  console.log('Status message updated');
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initial update
  updateStatusMessage();

  // Repeat every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(process.env.BOT_TOKEN);
