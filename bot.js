import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CONNECT_URL = process.env.CONNECT_URL || 'https://busybiblox.github.io/LAV-Redirect/';
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = process.env.SERVER_PORT;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Express keep-alive route
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Keep-alive server listening on port ${PORT}`);
});

async function updateStatusMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('Channel not found');
    return;
  }

  try {
    // Fetch server info and players
    const infoResponse = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
    const infoData = await infoResponse.json();

    const playersResponse = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/players.json`);
    const playersData = await playersResponse.json();

    const maxPlayers = infoData.vars.sv_maxClients || 'Unknown';
    const currentPlayers = playersData.length || 0;
    const serverName = infoData.vars.sv_projectName || 'Server';

    // Check if server is online
    const statusText = infoResponse.ok ? 'Online' : 'Offline';

    const embed = new EmbedBuilder()
      .setTitle(`${serverName} Status`)
      .setDescription(
        `Status: **${statusText}**\nPlayers: **${currentPlayers}/${maxPlayers}**\n[Connect](${CONNECT_URL})`
      )
      .setColor(statusText === 'Online' ? 0x00ff00 : 0xff0000)
      .setImage('https://i.imgur.com/5OrBONg.png') // Your custom image here
      .setTimestamp();

    // Fetch existing bot message to edit or send new
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find((msg) => msg.author.id === client.user.id);

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

  updateStatusMessage(); // Initial update
  setInterval(updateStatusMessage, 15 * 60 * 1000); // Update every 15 minutes
});

client.login(BOT_TOKEN);
