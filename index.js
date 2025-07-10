// --- DEPENDENCIES ---
require('dotenv').config(); 
// The main discord.js library
const { Client, GatewayIntentBits } = require('discord.js');
// The built-in http module for the keep-alive server
const http = require('http');


// --- CONFIGURATION ---
const token = process.env.DISCORD_TOKEN;
const sourceChannelId = process.env.sourceChannelId;
const targetChannelId = process.env.targetChannelId;


// --- BOT CLIENT INITIALIZATION ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Required to see server information
        GatewayIntentBits.GuildMessages,    // Required to see messages
        GatewayIntentBits.MessageContent    // Required to see message content and attachments (THE MOST IMPORTANT ONE for this bot)
    ]
});


// --- EVENT: BOT IS READY ---
// This event fires once the bot has successfully logged in and is online.
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! The bot is now online and ready.`);
});


// --- EVENT: MESSAGE IS CREATED (For Image Forwarding) ---
// This event fires every time a message is sent in a channel the bot can see.
client.on('messageCreate', async message => {
    // 1. Check if the message is in the correct source channel. If not, ignore it.
    if (message.channel.id !== sourceChannelId) {
        return; 
    }

    // 2. Check if the message was sent by a bot (including ourself). If so, ignore it.
    if (message.author.bot) {
        return; 
    }

    // 3. Check if the message actually contains an attachment.
    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();

        // 4. Verify the attachment is an image.
        if (attachment.contentType?.startsWith('image/')) {
            try {
                // Find the target channel
                const targetChannel = await client.channels.fetch(targetChannelId);

                if (targetChannel) {
                    // Send a new message in the target channel
                    await targetChannel.send({
                        //content: `Image from: **${message.author.tag}**`,
                        files: [attachment.url]
                    });

                    // delete the original message.
                    await message.delete();
                    console.log(`Successfully forwarded an image from ${message.author.tag}.`);
                }
            } catch (error) {
                console.error("Error during image forwarding:", error);
                // Optionally, inform the user that something went wrong.
                message.reply("Sorry, I encountered an error trying to forward your image.");
            }
        }
    }
});


// --- Slash Command ---.
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    //ping command
    if (commandName === 'ping') {
        const latency = client.ws.ping;
        await interaction.reply(`API Latency: **${latency}ms**`);
        console.log(`Responded to /ping command from ${interaction.user.tag}. Latency: ${latency}ms`);
    }
});


// --- KEEP ALIVE for RENDER ---

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write("M Jinda hu!");
  res.end();
}).listen(8080);


client.login(token);