const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

console.log('📁 Loading commands from:', foldersPath);

// Load all command files
function loadCommands(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(directory, item.name);
        
        if (item.isDirectory()) {
            loadCommands(fullPath);
        } else if (item.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ ${command.data.name}`);
                } else {
                    console.log(`❌ ${item.name} - missing properties`);
                }
            } catch (error) {
                console.error(`❌ Failed to load ${item.name}:`, error.message);
            }
        }
    }
}

loadCommands(foldersPath);

console.log(`\n📊 Total commands found: ${commands.length}`);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Deploying ${commands.length} commands globally...`);
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`\n🎉 Successfully deployed ${data.length} commands!`);
        console.log('\n📋 Command List:');
        console.log('================');
        data.forEach(cmd => console.log(`  /${cmd.name} - ${cmd.description}`));
        
        console.log('\n🔗 Invite Link:');
        console.log(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands&permissions=268435456`);
        
    } catch (error) {
        console.error('\n❌ Deployment failed:');
        console.error('Error:', error.message);
        if (error.code === 429) {
            console.log('⏳ Rate limited. Wait and try again.');
        }
    }
})();