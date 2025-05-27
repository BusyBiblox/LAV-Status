import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = process.env.SERVER_PORT;
const CONNECT_URL = 'https://busybiblox.github.io/LAV-Redirect/';

async function updateStatusMessage() {
  try {
    const infoRes = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
    if (!infoRes.ok) throw new Error(`Info fetch failed: ${infoRes.status}`);
    const infoData = await infoRes.json();

    const playersRes = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/players.json`);
    if (!playersRes.ok) throw new Error(`Players fetch failed: ${playersRes.status}`);
    const playersData = await playersRes.json();

    const maxPlayers = infoData.vars.sv_maxClients || 0;
    const currentPlayers = playersData.length;

    const embed = new EmbedBuilder()
      .setTitle('Server Status')
      .setDescription(`🟢 Online\nPlayers: **${currentPlayers}/${maxPlayers}**`)
      .setColor(0x00ff00)
      .setThumbnail('https://i.imgur.com/5OrBONg.png')
      .setFooter({ text: 'Updated every 15 minutes' });

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.error('Channel not found');

    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessage = messages.find(
      (m) => m.author.id === client.user.id && m.embeds.length > 0
    );

    const connectButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Connect')
        .setStyle(ButtonStyle.Link)
        .setURL(CONNECT_URL)
    );

    if (botMessage) {
      await botMessage.edit({ embeds: [embed], components: [connectButton] });
    } else {
      await channel.send({ embeds: [embed], components: [connectButton] });
    }
  } catch (error) {
    console.error('Failed to fetch server data:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);
