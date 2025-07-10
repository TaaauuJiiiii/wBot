// --- DEPENDENCIES ---
// We only need the discord.js library and the built-in http module.
// We have REMOVED require('dotenv').config() because Render provides environment variables directly.
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');


// --- DIAGNOSTIC LOGGING (VERY IMPORTANT!) ---
// Let's log the variables as soon as the script starts to see what Render is giving us.
// This is our most important debugging tool right now.
console.log('--- Reading Environment Variables ---');
console.log(`DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? 'Loaded' : 'MISSING!'}`);
console.log(`CLIENT_ID: ${process.env.CLIENT_ID ? 'Loaded' : 'MISSING!'}`);
console.log(`sourceChannelId: ${process.env.sourceChannelId ? 'Loaded' : 'MISSING!'}`);
console.log(`targetChannelId: ${process.env.targetChannelId ? 'Loaded' : 'MISSING!'}`);
console.log('------------------------------------');


// --- CONFIGURATION ---
// Load all necessary IDs directly from the environment.
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
                        content: `Image from: **${message.author.tag}**`,
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
        await interaction.reply(`API Latency: **${latency}ms**`);
        console.log(`Responded to /ping command. Latency: ${latency}ms`);
    }
});


// --- KEEP-ALIVE SERVER for RENDER ---
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write("Bot is alive!");
  res.end();
}).listen(8080);


// --- BOT LOGIN ---
// A final check before attempting to log in.
if (!token) {
    console.error("FATAL ERROR: DISCORD_TOKEN is not defined. The bot cannot start.");
    // We exit here so the process doesn't hang forever.
    process.exit(1); 
}

client.login(token);