import Discord from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const client = new Discord.Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = process.env.SERVER_PORT;
const CONNECT_URL = "https://busybiblox.github.io/LAV-Redirect/"; // hardcoded or use env var if you want

async function updateStatusMessage() {
  try {
    // Fetch server info
    const infoRes = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/info.json`);
    if (!infoRes.ok) throw new Error(`Info fetch failed: ${infoRes.status}`);

    const infoData = await infoRes.json();

    // Fetch players info
    const playersRes = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/players.json`);
    if (!playersRes.ok) throw new Error(`Players fetch failed: ${playersRes.status}`);

    const playersData = await playersRes.json();

    const maxPlayers = infoData.vars.sv_maxClients || 0;
    const currentPlayers = playersData.length;
    const isOnline = infoRes.ok;

    const embed = new Discord.MessageEmbed()
      .setTitle("Server Status")
      .setDescription(
        isOnline
          ? `🟢 Online\nPlayers: **${currentPlayers}/${maxPlayers}**`
          : "🔴 Offline"
      )
      .setColor(isOnline ? "GREEN" : "RED")
      .setThumbnail("https://i.imgur.com/5OrBONg.png") // Your image link
      .setFooter({ text: "Updated every 15 minutes" });

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.error("Channel not found");

    // Find existing bot message
    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessage = messages.find(
      (m) => m.author.id === client.user.id && m.embeds.length > 0
    );

    const connectButton = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setLabel("Connect")
        .setStyle("LINK")
        .setURL(CONNECT_URL)
    );

    if (botMessage) {
      await botMessage.edit({ embeds: [embed], components: [connectButton] });
    } else {
      await channel.send({ embeds: [embed], components: [connectButton] });
    }
  } catch (error) {
    console.error("Failed to fetch server data:", error);
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await updateStatusMessage();

  // Update every 15 minutes
  setInterval(updateStatusMessage, 15 * 60 * 1000);
});

client.login(BOT_TOKEN);
