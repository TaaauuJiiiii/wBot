require('dotenv').config(); 

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// --- CONFIGURATION ---
const token = process.env.DISCORD_TOKEN;
const sourceChannelId = process.env.sourceChannelId;
const targetChannelId = process.env.targetChannelId;
// Load the authorized user IDs and split them into an array
const authorizedUserIds = (process.env.AUTHORIZED_USER_IDS || '').split(',');


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
    // This logic remains unchanged
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
        await interaction.reply({ 
            content: `API Latency: **${latency}ms**`,
            ephemeral: true 
        });
        console.log(`Responded privately to /ping command from ${interaction.user.tag}. Latency: ${latency}ms`);
    
    } else if (commandName === 'delete') {
        // --- NEW DELETE COMMAND LOGIC ---

        // 1. Check if the user is authorized
        if (!authorizedUserIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: 'You are not authorized to use this command.',
                ephemeral: true,
            });
        }

        // 2. Get the message ID from the command's options
        const messageIdOrLink = interaction.options.getString('message_id');
        // Handle both raw IDs and full message links by extracting the last part
        const messageId = messageIdOrLink.split('/').pop();

        try {
            // 3. Fetch the target channel
            const targetChannel = await client.channels.fetch(targetChannelId);
            if (!targetChannel) {
                 return interaction.reply({ content: 'Could not find the target channel.', ephemeral: true });
            }

            // 4. Fetch the specific message from the channel
            const messageToDelete = await targetChannel.messages.fetch(messageId);

            // 5. IMPORTANT: Verify the message was actually sent by our bot
            if (messageToDelete.author.id !== client.user.id) {
                return interaction.reply({
                    content: 'I can only delete messages that I have sent myself.',
                    ephemeral: true,
                });
            }

            // 6. If all checks pass, delete the message
            await messageToDelete.delete();
            await interaction.reply({
                content: 'Successfully deleted the message.',
                ephemeral: true,
            });
            console.log(`User ${interaction.user.tag} deleted message ${messageId}.`);

        } catch (error) {
            console.error("Error during /delete command:", error);
            await interaction.reply({
                content: 'Could not find or delete the message. Please check the ID/link and ensure I have "Manage Messages" permissions in the target channel.',
                ephemeral: true,
            });
        }
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
    console.error("FATAL ERROR: DISCORD_TOKEN is not defined.");
    process.exit(1); 
}
client.login(token);