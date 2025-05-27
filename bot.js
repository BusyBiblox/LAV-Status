import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = process.env.SERVER_PORT;

// Status image URL you wanted to add
const STATUS_IMAGE_URL = 'https://i.imgur.com/5OrBONg.png';

// Construct your server URLs (using HTTP due to SSL issues)
const INFO_URL = `http://${SERVER_IP}:${SERVER_PORT}/info.json`;
const PLAYERS_URL = `http://${SERVER_IP}:${SERVER_PORT}/players.json`;

let statusMessage;

async function updateStatusMessage() {
  try {
    // Fetch info.json
    const infoRes = await fetch(INFO_URL);
    if (!infoRes.ok) throw new Error(`Info fetch failed with status ${infoRes.status}`);
    const info = await infoRes.json();

    // Fetch players.json
    const playersRes = await fetch(PLAYERS_URL);
    if (!playersRes.ok) throw new Error(`Players fetch failed with status ${playersRes.status}`);
    const players = await playersRes.json();

    const maxPlayers = info.vars?.sv_maxClients || 'unknown';
    const playerCount = players.length;

    // Determine server status (online if fetched successfully)
    const serverStatus = 'Online';

    // Prepare the embed with updated info and image
    const embed = new EmbedBuilder()
      .setTitle('LAV Server Status')
      .setColor(playerCount > 0 ? 0x00ff00 : 0xff0000) // green if players online, red otherwise
      .addFields(
        { name: 'Status', value: serverStatus, inline: true },
        { name: 'Players', value: `${playerCount} / ${maxPlayers}`, inline: true }
      )
      .setImage(STATUS_IMAGE_URL)
      .setTimestamp();

    // Edit existing message or send new one
    if (!statusMessage) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      statusMessage = await channel.send({ embeds: [embed] });
    } else {
      await statusMessage.edit({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Failed to fetch server data:', error);

    // Show offline status in embed on failure
    const embed = new EmbedBuilder()
      .setTitle('LAV Server Status')
      .setColor(0xff0000)
      .addFields(
        { name: 'Status', value: 'Offline', inline: true },
        { name: 'Players', value: '0 / 0', inline: true }
      )
      .setImage(STATUS_IMAGE_URL)
      .setTimestamp();

    if (!statusMessage) {
      const channel = await client.channels.fetch(CHANNEL_ID);
      statusMessage = await channel.send({ embeds: [embed] });
    } else {
      await statusMessage.edit({ embeds: [embed] });
    }
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Fetch the first status message in the channel if any, so we can edit it
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });
    statusMessage = messages.find(msg => msg.author.id === client.user.id);
  } catch (e) {
    console.warn('Could not fetch messages in channel:', e);
  }

  // Update immediately
  await updateStatusMessage();

  // Update every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);
