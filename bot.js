import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = '104.243.32.183';   // Replace with your FiveM server IP
const SERVER_PORT = '25001';           // Replace with your FiveM server port
const CONNECT_URL = 'https://busybiblox.github.io/LAV-Redirect/';  // Your redirect URL

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let statusMessageId;

async function updateStatusMessage() {
  try {
    const res = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
    const data = await res.json();

    const isOnline = data ? true : false;
    const playerCount = data.clients ?? 0;
    const maxPlayers = data.sv_maxclients ?? 0;

    const statusEmbed = new EmbedBuilder()
      .setTitle('FiveM Server Status')
      .setDescription(isOnline
        ? `🟢 Server is **ONLINE**\nPlayers: ${playerCount} / ${maxPlayers}`
        : '🔴 Server is **OFFLINE**')
      .setColor(isOnline ? 0x00ff00 : 0xff0000) // Green if online, red if offline
      .setTimestamp(new Date())
      .setImage('https://imgur.com/a/GTl1yW8')  // Change this to your own image URL
      .setFooter({ text: 'Updated every 15 minutes' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Connect to Server')
        .setStyle(ButtonStyle.Link)
        .setURL(CONNECT_URL)
    );

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (statusMessageId) {
      // Edit existing message
      const message = await channel.messages.fetch(statusMessageId);
      await message.edit({ embeds: [statusEmbed], components: [row] });
    } else {
      // Send new message and save message ID
      const message = await channel.send({ embeds: [statusEmbed], components: [row] });
      statusMessageId = message.id;
    }
  } catch (error) {
    console.error('Error updating server status:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Run immediately, then every 15 minutes
  await updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

// Express server to keep bot alive on hosting platforms like Render or Replit
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

client.login(BOT_TOKEN);
