import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function updateStatusMessage() {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });
    const statusMessage = messages.find(msg => msg.author.id === client.user.id);

    if (!statusMessage) {
      console.log('Status message not found.');
      return;
    }

    const url = `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/info.json`;
    const res = await fetch(url);
    const text = await res.text();
    console.log('Raw server response:', text);

    const data = JSON.parse(text);

    const players = data.players || [];
    const maxPlayers = data.vars.sv_maxClients || 'Unknown';
    const status = players.length > 0 ? 'Online' : 'Offline';

    const embed = new EmbedBuilder()
      .setTitle(`${data.vars.sv_projectName || 'Server'} Status`)
      .setDescription(`Status: **${status}**\nPlayers: **${players.length}/${maxPlayers}**`)
      .setColor(status === 'Online' ? 0x00FF00 : 0xFF0000)
      .setImage('https://i.imgur.com/5OrBONg.png')  // Your image URL here
      .setTimestamp();

    await statusMessage.edit({ embeds: [embed] });
    console.log('Status message updated.');

  } catch (error) {
    console.error('Failed to update status message:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Initial update
  updateStatusMessage();

  // Update every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(process.env.BOT_TOKEN);
