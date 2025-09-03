// We now need ApplicationCommandOptionType for slash command options
// and ApplicationCommandType for context menu command types.
const { REST, Routes, ApplicationCommandOptionType, ApplicationCommandType } = require('discord.js');
require('dotenv').config();

// The array of command definitions
const commands = [
    {
        name: 'ping',
        description: "Checks the bot's API latency to Discord.",
    },
    {
        name: 'delete',
        description: 'Deletes a specific image message sent by the bot (by ID/link).',
        options: [
            {
                name: 'message_id',
                description: 'The ID or link of the message to delete',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    // --- NEW CONTEXT MENU COMMAND ---
    {
        name: 'Delete Bot Image', // This is the text that will appear in the "Apps" menu
        type: ApplicationCommandType.Message, // This tells Discord it's a context menu command for messages
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
        console.log(`Started refreshing ${commands.length} application (/) and context menu command(s).`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) and context menu command(s).`);
    } catch (error) {
        console.error('An error occurred while deploying commands:', error);
    }
})();