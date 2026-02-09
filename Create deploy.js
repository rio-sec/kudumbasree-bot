# Create deploy.js
cat > deploy.js << 'EOF'
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'ping',
        description: 'Check bot latency'
    },
    {
        name: 'vc-move-all',
        description: 'Move all voice channel users',
        options: [
            {
                name: 'channel',
                description: 'Destination voice channel',
                type: 7, // CHANNEL
                required: true
            }
        ]
    },
    {
        name: 'vc-swap',
        description: 'Swap members between voice channels',
        options: [
            {
                name: 'channel1',
                description: 'First voice channel',
                type: 7,
                required: true
            },
            {
                name: 'channel2',
                description: 'Second voice channel',
                type: 7,
                required: true
            }
        ]
    },
    {
        name: 'dnd-setup',
        description: 'Setup DnD voice system'
    },
    {
        name: 'logs-setup',
        description: 'Setup premium logging'
    },
    {
        name: 'serverinfo',
        description: 'Show server information'
    },
    {
        name: 'help',
        description: 'Show all commands'
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🔄 Registering commands...');
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(`✅ Registered ${data.length} commands!`);
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
EOF

# Run it
node deploy.js