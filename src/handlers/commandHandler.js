const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
    const commands = [];
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    console.log(`✅ Command: /${command.data.name}`);
                } else {
                    console.log(`⚠️  Skipping ${file} - missing data/execute`);
                }
            } catch (error) {
                console.error(`❌ Error loading ${file}:`, error);
            }
        }
    }

    // Register commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    client.once('ready', async () => {
        try {
            console.log(`🔄 Registering ${commands.length} commands...`);
            
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            
            console.log('✅ Successfully registered all commands!');
        } catch (error) {
            console.error('❌ Failed to register commands:', error);
        }
    });
};