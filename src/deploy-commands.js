const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];
// Add your commands here

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Commands deployed!');
    } catch (error) {
        console.error(error);
    }
})();