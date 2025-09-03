// We now need ApplicationCommandOptionType to define the command's options
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
require('dotenv').config();

// The array of command definitions
const commands = [
    {
        name: 'ping',
        description: "Checks the bot's API latency to Discord.",
    },
    {
        name: 'delete',
        description: 'Deletes a specific image message sent by the bot.',
        options: [
            {
                name: 'message_id',
                description: 'The ID or link of the message to delete',
                // This defines the option as a string input
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
];

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('ERROR: Missing DISCORD_TOKEN or CLIENT_ID in the environment variables.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) command(s).`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) command(s).`);
    } catch (error) {
        console.error('An error occurred while deploying commands:', error);
    }
})();