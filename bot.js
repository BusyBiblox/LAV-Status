import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_IP = process.env.SERVER_IP;          // e.g. "104.243.32.183"
const SERVER_PORT = process.env.SERVER_PORT;      // e.g. "25001"
const CONNECT_URL = process.env.CONNECT_URL || "https://busybiblox.github.io/LAV-Redirect/"; 

let statusMessage;

async function getServerInfo() {
  try {
    const res = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
    if (!res.ok) throw new Error('Info endpoint unreachable');
    return await res.json();
  } catch {
    return null;  // server offline or error
  }
}

async function getPlayerCount() {
  try {
    const res = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/players.json`);
    if (!res.ok) throw new Error('Players endpoint unreachable');
    const players = await res.json();
    return players.length;
  } catch {
    return null;  // no players info available or error
  }
}

async function updateStatusMessage() {
  const serverInfo = await getServerInfo();
  if (!serverInfo) {
    // Server offline
    const offlineEmbed = new EmbedBuilder()
      .setTitle('Server Status: Offline ❌')
      .setDescription('The FiveM server is currently offline.')
      .setColor('Red');

    const button = new ButtonBuilder()
      .setLabel('Connect to Server')
      .setStyle(ButtonStyle.Link)
      .setURL(CONNECT_URL);

    const row = new ActionRowBuilder().addComponents(button);

    if (statusMessage) {
      await statusMessage.edit({ embeds: [offlineEmbed], components: [row] });
    } else {
      const channel = await client.channels.fetch(CHANNEL_ID);
      statusMessage = await channel.send({ embeds: [offlineEmbed], components: [row] });
    }
    return;
  }

  // Server online
  const maxPlayers = parseInt(serverInfo.vars.sv_maxClients, 10) || 0;
  const currentPlayers = await getPlayerCount();

  const onlineEmbed = new EmbedBuilder()
    .setTitle('Server Status: Online ✅')
    .setDescription(`**${currentPlayers ?? '?'}** / **${maxPlayers}** players online`)
    .setColor('Green')
    .setFooter({ text: serverInfo.vars.sv_projectName || 'FiveM Server' })
    .setThumbnail('https://cdn.discordapp.com/attachments/1104565371184221440/1119583813102917650/LAV-Banner-Red.png'); // Update with your server image URL

  const button = new ButtonBuilder()
    .setLabel('Connect to Server')
    .setStyle(ButtonStyle.Link)
    .setURL(CONNECT_URL);

  const row = new ActionRowBuilder().addComponents(button);

  if (statusMessage) {
    await statusMessage.edit({ embeds: [onlineEmbed], components: [row] });
  } else {
    const channel = await client.channels.fetch(CHANNEL_ID);
    statusMessage = await channel.send({ embeds: [onlineEmbed], components: [row] });
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initial message
  await updateStatusMessage();

  // Update every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);
