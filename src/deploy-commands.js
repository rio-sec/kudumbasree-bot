const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ ${command.data.name}`);
        } else {
            console.log(`❌ ${file} is missing required properties`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Deploying ${commands.length} commands...`);
        
        // For global commands
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ Successfully deployed ${data.length} commands globally!`);
        console.log('\n📋 Command List:');
        data.forEach(cmd => console.log(`  /${cmd.name} - ${cmd.description}`));
        
        // Generate invite link
        console.log(`\n🔗 Invite Link:`);
        console.log(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands&permissions=268435456`);
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        
        if (error.code === 429) {
            console.log('⏳ Rate limited. Wait and try again.');
        }
    }
})();