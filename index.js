// This line is for LOCAL DEVELOPMENT. It loads the variables from your .env file.
require('dotenv').config(); 

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');


// --- CONFIGURATION ---
const token = process.env.DISCORD_TOKEN;
const sourceChannelId = process.env.sourceChannelId;
const targetChannelId = process.env.targetChannelId;


// --- BOT CLIENT INITIALIZATION ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// --- EVENT: BOT IS READY ---
client.on('ready', () => {
    console.log(`SUCCESS! Logged in as ${client.user.tag}. The bot is now online.`);
});


// --- EVENT: MESSAGE IS CREATED (For Image Forwarding) ---
client.on('messageCreate', async message => {
    if (message.channel.id !== sourceChannelId) return;
    if (message.author.bot) return;

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        if (attachment.contentType?.startsWith('image/')) {
            try {
                const targetChannel = await client.channels.fetch(targetChannelId);
                if (targetChannel) {
                    await targetChannel.send({
                        //content: `Image from: **${message.author.tag}**`,
                        files: [attachment.url]
                    });
                    await message.delete();
                    console.log(`Forwarded an image from ${message.author.tag}.`);
                }
            } catch (error) {
                console.error("Error during image forwarding:", error);
            }
        }
    }
});


// --- EVENT: INTERACTION IS CREATED (For Slash Commands) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    if (commandName === 'ping') {
        const latency = client.ws.ping;
        
        // THIS IS THE CHANGED SECTION
        // We now reply with an object to make the response ephemeral (visible only to the sender).
        await interaction.reply({ 
            content: `Latency: **${latency}ms**`,
            ephemeral: true 
        });
        
        console.log(`Responded privately to /ping command from ${interaction.user.tag}. Latency: ${latency}ms`);
    }
});


// --- KEEP-ALIVE SERVER for RENDER ---
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write("Bot is alive!");
  res.end();
}).listen(8080);


// --- BOT LOGIN ---
if (!token) {
    console.error("FATAL ERROR: DISCORD_TOKEN is not defined. Check your .env file locally or your Environment Variables on Render.");
    process.exit(1); 
}

client.login(token);