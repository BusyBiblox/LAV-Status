import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const CONNECT_URL = process.env.CONNECT_URL; // https://busybiblox.github.io/LAV-Redirect/
const STATUS_MESSAGE_ID = process.env.STATUS_MESSAGE_ID; // optional, if you want to update an existing message

const SERVER_IP = process.env.SERVER_IP; // e.g. 104.243.32.183:25001

async function updateStatusMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('Channel not found');
    return;
  }

  // Fetch server info from your FiveM endpoint
  let status = 'Offline';
  let playerCount = 0;
  let maxPlayers = 0;

  try {
    const res = await fetch(`http://${SERVER_IP}/info.json`);
    if (res.ok) {
      const data = await res.json();
      playerCount = data.clients;
      maxPlayers = data.sv_maxClients;
      status = 'Online';
    }
  } catch (error) {
    console.error('Error fetching server info:', error);
  }

  const embed = new EmbedBuilder()
    .setTitle('LAV FiveM Server Status')
    .setDescription(`Status: **${status}**\nPlayers: **${playerCount}/${maxPlayers}**`)
    .setThumbnail('https://i.imgur.com/5OrBONg.png')
    .setColor(status === 'Online' ? 0x00FF00 : 0xFF0000)
    .setTimestamp();

  const connectButton = new ButtonBuilder()
    .setLabel('Connect to Server')
    .setStyle(ButtonStyle.Link)
    .setURL(CONNECT_URL);

  const row = new ActionRowBuilder().addComponents(connectButton);

  if (STATUS_MESSAGE_ID) {
    try {
      const message = await channel.messages.fetch(STATUS_MESSAGE_ID);
      await message.edit({ embeds: [embed], components: [row] });
    } catch {
      const message = await channel.send({ embeds: [embed], components: [row] });
      console.log('New status message sent. Update STATUS_MESSAGE_ID accordingly.');
    }
  } else {
    await channel.send({ embeds: [embed], components: [row] });
    console.log('Status message sent (no STATUS_MESSAGE_ID set).');
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Update immediately and every 15 minutes
  updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(process.env.BOT_TOKEN);
