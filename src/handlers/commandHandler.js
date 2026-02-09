const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    console.log('📁 Looking for commands in:', commandsPath);
    
    // Check if directory exists
    if (!fs.existsSync(commandsPath)) {
        console.error('❌ Commands directory not found!');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }
    
    const commandFolders = fs.readdirSync(commandsPath);
    console.log('📂 Found folders:', commandFolders);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        // Skip if not a directory
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        console.log(`\n📂 Processing folder: ${folder}`);
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        console.log(`📄 Found ${commandFiles.length} files:`, commandFiles);
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            console.log(`\n🔄 Loading: ${file}`);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                
                if (!command.data) {
                    console.log(`❌ Skipping ${file} - missing 'data' property`);
                    continue;
                }
                
                if (!command.execute) {
                    console.log(`❌ Skipping ${file} - missing 'execute' function`);
                    continue;
                }
                
                if (typeof command.data.toJSON !== 'function') {
                    console.log(`❌ Skipping ${file} - data is not a SlashCommandBuilder`);
                    continue;
                }
                
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded: /${command.data.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to load ${file}:`, error.message);
            }
        }
    }

    console.log(`\n📊 Total commands loaded: ${commands.length}`);
    console.log('Command names:', commands.map(cmd => cmd.name));

    // Register commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log(`\n🔄 Registering ${commands.length} commands to Discord...`);
        
        // First, get existing commands
        const existingCommands = await rest.get(
            Routes.applicationCommands(client.user.id)
        );
        console.log(`🗑️  Removing ${existingCommands.length} old commands...`);
        
        // Delete old commands
        for (const cmd of existingCommands) {
            await rest.delete(
                Routes.applicationCommand(client.user.id, cmd.id)
            );
        }
        
        // Register new commands
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log(`✅ Successfully registered ${data.length} commands!`);
        console.log('📋 Registered commands:', data.map(cmd => cmd.name).join(', '));
        
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
        if (error.code === 429) {
            console.log('⏳ Rate limited. Retrying in 10 seconds...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            // Retry logic here
        }
    }
};