// This allows us to use variables from our .env file
require('dotenv').config();

// These are the classes we need from the discord.js library
const { Client, GatewayIntentBits } = require('discord.js');

// This imports our channel IDs from the config.json file
const sourceChannelId = process.env.sourceChannelId;
const targetChannelId = process.env.targetChannelId;

// Create a new bot client
// We need to tell Discord what our bot intends to do
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // To see servers
        GatewayIntentBits.GuildMessages,    // To see messages in servers
        GatewayIntentBits.MessageContent    // To see the content of messages, including attachments
    ]
});

// This event runs once when the bot successfully logs in
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! The bot is now online.`);
});

// This event runs every time a new message is created in any channel the bot can see
client.on('messageCreate', async message => {
    // 1. We check if the message is from the correct source channel
    if (message.channel.id !== sourceChannelId) {
        return; // If not, we ignore the message and do nothing
    }

    // 2. We check if the message was sent by a bot. We don't want the bot to react to itself!
    if (message.author.bot) {
        return; // If it's a bot, ignore it
    }

    // 3. We check if the message has an attachment (an image, video, file, etc.)
    if (message.attachments.size > 0) {
        // Get the first attachment from the message
        const attachment = message.attachments.first();

        // Let's make sure the attachment is an image
        if (attachment.contentType?.startsWith('image/')) {
            try {
                // Find the target channel where we want to send the image
                const targetChannel = await client.channels.fetch(targetChannelId);

                // If the channel is found...
                if (targetChannel) {
                    // Send the image to the target channel.
                    // We include the original sender's name for context.
                    await targetChannel.send({
                        // content: `from: **${message.author.tag}**`,
                        files: [attachment.url] // The URL of the image to send
                    });

                    // After successfully sending, delete the original message
                    await message.delete();
                    console.log(`Forwarded an image from ${message.author.tag} and deleted the original.`);
                }
            } catch (error) {
                console.error("Something went wrong:", error);
                // Maybe send a message back to the user saying something failed
                message.reply("Sorry, I couldn't forward your image. An error occurred.");
            }
        }
    }
});

// Log in to Discord with your client's token from the .env file
client.login(process.env.DISCORD_TOKEN);