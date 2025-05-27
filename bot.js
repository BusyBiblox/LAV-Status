import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_STATUS_URL = process.env.SERVER_STATUS_URL;

if (!TOKEN || !CHANNEL_ID || !SERVER_STATUS_URL) {
  console.error('ERROR: Missing one or more environment variables: TOKEN, CHANNEL_ID, SERVER_STATUS_URL');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function updateStatusMessage() {
  try {
    const res = await fetch(SERVER_STATUS_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const data = await res.json();

    // Extract player count info from your JSON structure
    const players = data.players ?? data.vars?.sv_maxClients ?? 0;
    const maxPlayers = data.vars?.sv_maxClients ?? 0;

    const isOnline = players > 0;

    const embed = new EmbedBuilder()
      .setTitle('LAV Server Status')
      .setDescription(isOnline ? '🟢 **Online**' : '🔴 **Offline**')
      .addFields(
        { name: 'Players', value: `${players} / ${maxPlayers}`, inline: true }
      )
      .setImage('https://i.imgur.com/5OrBONg.png')
      .setTimestamp()
      .setFooter({ text: 'Updated every 15 minutes' });

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.error('Channel not found.');
      return;
    }

    // Find existing bot status message to edit it, or send a new one
    const messages = await channel.messages.fetch({ limit: 20 });
    const botMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

    if (botMessage) {
      await botMessage.edit({ embeds: [embed] });
      console.log('Status message updated.');
    } else {
      await channel.send({ embeds: [embed] });
      console.log('Status message sent.');
    }
  } catch (error) {
    console.error('Failed to fetch server data:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatusMessage();

  // Update every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(TOKEN);
