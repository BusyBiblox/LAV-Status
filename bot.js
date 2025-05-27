import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const channelId = process.env.CHANNEL_ID;
const connectUrl = process.env.CONNECT_URL;
const serverIp = process.env.SERVER_IP;
const serverPort = process.env.SERVER_PORT;

async function updateStatusMessage() {
  try {
    const infoRes = await fetch(`http://${serverIp}:${serverPort}/info.json`);
    const infoData = await infoRes.json();

    const playersRes = await fetch(`http://${serverIp}:${serverPort}/players.json`);
    const playersData = await playersRes.json();

    const maxPlayers = infoData.vars.sv_maxClients || 0;
    const currentPlayers = playersData.length || 0;

    const serverOnline = currentPlayers > 0 || maxPlayers > 0;

    // Color green if online, red if offline
    const statusColor = serverOnline ? 0x57f287 : 0xed4245; 

    const embed = new EmbedBuilder()
      .setTitle('LAV Server Status')
      .setDescription(serverOnline ? '🟢 Online' : '🔴 Offline')
      .addFields(
        { name: 'Players', value: `${currentPlayers} / ${maxPlayers}`, inline: true },
      )
      .setColor(statusColor)
      .setThumbnail('https://i.imgur.com/5OrBONg.png') // your server image
      .setFooter({ text: 'Last updated' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🎮 Connect')
        .setStyle(ButtonStyle.Link)
        .setURL(connectUrl)
    );

    const channel = await client.channels.fetch(channelId);
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(m => m.author.id === client.user.id);

    if (botMessage) {
      await botMessage.edit({ embeds: [embed], components: [row] });
    } else {
      await channel.send({ embeds: [embed], components: [row] });
    }
    
    console.log('Status message updated');
  } catch (error) {
    console.error('Failed to fetch server data:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateStatusMessage();
  setInterval(updateStatusMessage, 15 * 60 * 1000); // every 15 minutes
});

client.login(process.env.BOT_TOKEN);
