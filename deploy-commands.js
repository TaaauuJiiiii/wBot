// --- DEPENDENCIES ---

const { REST, Routes } = require('discord.js');

require('dotenv').config();


// --- COMMAND DEFINITION ---

const commands = [
    {
        name: 'ping',
        description: "Checks the bot's API latency to Discord.",
    },
    // can add more command objects here in the future!
    // {
    //   name: 'another-command',
    //   description: 'Does something else.',
    // },
];


// --- LOAD CREDENTIALS ---
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('ERROR: Missing DISCORD_TOKEN or CLIENT_ID in the environment variables.');
    console.error('Please make sure you have a .env file with these values when running this script locally.');
    process.exit(1);
}


// --- DEPLOYMENT SCRIPT ---
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