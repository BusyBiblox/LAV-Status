import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const SERVER_IP = process.env.SERVER_IP; // e.g. "123.45.67.89:30120"
const CHANNEL_ID = process.env.CHANNEL_ID; // Discord channel ID for status message
const BOT_TOKEN = process.env.BOT_TOKEN; // Your Discord bot token

let statusMessageId = null;

async function fetchServerStatus() {
  try {
    const infoRes = await fetch(`http://${SERVER_IP}/info.json`);
    const playersRes = await fetch(`http://${SERVER_IP}/players.json`);

    if (!infoRes.ok || !playersRes.ok) throw new Error('Server unreachable');

    const info = await infoRes.json();
    const players = await playersRes.json();

    return {
      online: true,
      maxPlayers: info.vars?.sv_maxClients || info.vars?.sv_maxclients || 0,
      currentPlayers: players.length,
    };
  } catch {
    return { online: false };
  }
}

async function updateStatusMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return console.error('Channel not found');

  const status = await fetchServerStatus();

  const embed = new EmbedBuilder()
    .setTitle('FiveM Server Status')
    .setTimestamp()
    .setColor(status.online ? 0x00ff00 : 0xff0000);

  let description;
  if (status.online) {
    description = `🟢 **Online**\nPlayers: **${status.currentPlayers}** / **${status.maxPlayers}**`;
  } else {
    description = '🔴 **Offline or unreachable**';
  }
  embed.setDescription(description);

  const row = new ActionRowBuilder();

  if (status.online) {
    const connectButton = new ButtonBuilder()
      .setLabel('Connect to Server')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://busybiblox.github.io/LAV-Redirect/`);
    row.addComponents(connectButton);
  }

  try {
    if (statusMessageId) {
      const message = await channel.messages.fetch(statusMessageId);
      await message.edit({ embeds: [embed], components: status.online ? [row] : [] });
    } else {
      const message = await channel.send({ embeds: [embed], components: status.online ? [row] : [] });
      statusMessageId = message.id;
    }
  } catch (err) {
    console.error('Failed to send or edit status message:', err);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await updateStatusMessage();

  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);
