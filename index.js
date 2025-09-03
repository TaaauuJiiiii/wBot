require('dotenv').config(); 

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// --- CONFIGURATION ---
const token = process.env.DISCORD_TOKEN;
const sourceChannelId = process.env.sourceChannelId;
const targetChannelId = process.env.targetChannelId;
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
    if (message.channel.id !== sourceChannelId) return;
    if (message.author.bot) return;

    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        if (attachment.contentType?.startsWith('image/')) {
            try {
                const targetChannel = await client.channels.fetch(targetChannelId);
                if (targetChannel) {
                    await targetChannel.send({
                     // content: `Image from: **${message.author.tag}**`,
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

// --- EVENT: INTERACTION IS CREATED (For Slash Commands and Context Menu Commands) ---
client.on('interactionCreate', async interaction => {
    // Handle Chat Input Commands (slash commands like /ping, /delete)
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'ping') {
            const latency = client.ws.ping;
            await interaction.reply({ 
                content: `API Latency: **${latency}ms**`,
                ephemeral: true 
            });
            console.log(`Responded privately to /ping command from ${interaction.user.tag}. Latency: ${latency}ms`);
        
        } else if (commandName === 'delete') {
            // --- DELETE SLASH COMMAND LOGIC ---

            // 1. Check if the user is authorized
            if (!authorizedUserIds.includes(interaction.user.id)) {
                return interaction.reply({
                    content: 'You are not authorized to use this command.',
                    ephemeral: true,
                });
            }

            // 2. Get the message ID from the command's options
            const messageIdOrLink = interaction.options.getString('message_id');
            const messageId = messageIdOrLink.split('/').pop(); // Extract ID from link or use raw ID

            try {
                // 3. Fetch the target channel
                const targetChannel = await client.channels.fetch(targetChannelId);
                if (!targetChannel) {
                     return interaction.reply({ content: 'Could not find the target channel.', ephemeral: true });
                }

                // 4. Fetch the specific message from the channel
                const messageToDelete = await targetChannel.messages.fetch(messageId);

                // 5. IMPORTANT: Verify the message was actually sent by our bot AND is in the target channel
                if (messageToDelete.author.id !== client.user.id || messageToDelete.channel.id !== targetChannelId) {
                    return interaction.reply({
                        content: 'I can only delete messages that I have sent myself in the designated target channel.',
                        ephemeral: true,
                    });
                }

                // 6. If all checks pass, delete the message
                await messageToDelete.delete();
                await interaction.reply({
                    content: 'Successfully deleted the message.',
                    ephemeral: true,
                });
                console.log(`User ${interaction.user.tag} deleted message ${messageId} via slash command.`);

            } catch (error) {
                console.error("Error during /delete slash command:", error);
                await interaction.reply({
                    content: 'Could not find or delete the message. Please check the ID/link and ensure I have "Manage Messages" permissions in the target channel.',
                    ephemeral: true,
                });
            }
        }
    } 
    // Handle Message Context Menu Commands (right-click -> Apps -> Delete Bot Image)
    else if (interaction.isMessageContextMenuCommand()) {
        if (interaction.commandName === 'Delete Bot Image') {
            // --- DELETE CONTEXT MENU COMMAND LOGIC ---

            // 1. Check if the user is authorized
            if (!authorizedUserIds.includes(interaction.user.id)) {
                return interaction.reply({
                    content: 'You are not authorized to use this command.',
                    ephemeral: true,
                });
            }

            // The message the user right-clicked on is available directly
            const messageToDelete = interaction.targetMessage;

            try {
                // 2. IMPORTANT: Verify the message was actually sent by our bot AND is in the target channel
                if (messageToDelete.author.id !== client.user.id || messageToDelete.channel.id !== targetChannelId) {
                    return interaction.reply({
                        content: 'I can only delete messages that I have sent myself in the designated target channel.',
                        ephemeral: true,
                    });
                }

                // 3. If all checks pass, delete the message
                await messageToDelete.delete();
                await interaction.reply({
                    content: 'Successfully deleted the message.',
                    ephemeral: true,
                });
                console.log(`User ${interaction.user.tag} deleted message ${messageToDelete.id} via context menu.`);

            } catch (error) {
                console.error("Error during 'Delete Bot Image' context menu command:", error);
                await interaction.reply({
                    content: 'Could not delete the message. Ensure I have "Manage Messages" permissions in the target channel.',
                    ephemeral: true,
                });
            }
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