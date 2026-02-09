const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Change bot status/activity')
        .addSubcommand(subcommand =>
            subcommand
                .setName('preset')
                .setDescription('Use a preset status')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Preset status type')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎮 Gaming', value: 'gaming' },
                            { name: '🎵 Listening', value: 'listening' },
                            { name: '🎬 Watching', value: 'watching' },
                            { name: '💭 Thinking', value: 'thinking' },
                            { name: '🚀 Busy', value: 'busy' },
                            { name: '😴 AFK', value: 'afk' },
                            { name: '🎉 Party', value: 'party' },
                            { name: '👨‍💻 Coding', value: 'coding' },
                            { name: '🎧 DJ Mode', value: 'dj' },
                            { name: '🛡️ Moderation', value: 'mod' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('custom')
                .setDescription('Set custom status')
                .addStringOption(option =>
                    option
                        .setName('activity')
                        .setDescription('Activity type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Playing', value: 'playing' },
                            { name: 'Listening', value: 'listening' },
                            { name: 'Watching', value: 'watching' },
                            { name: 'Competing', value: 'competing' },
                            { name: 'Streaming', value: 'streaming' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('Status text (max 128 chars)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('Stream URL (for streaming only)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset to default status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show current status info')
        )
        .setDefaultMemberPermissions(0) // Owner only - set specific permission if needed
        .setDMPermission(false),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client;

        // Permission check - Bot owner only
        const BOT_OWNER_ID = process.env.BOT_OWNER_ID || interaction.user.id;
        if (interaction.user.id !== BOT_OWNER_ID) {
            return interaction.reply({
                content: '❌ This command is for bot owner only!',
                ephemeral: true
            });
        }

        switch (subcommand) {
            case 'preset':
                await handlePreset(interaction);
                break;
            case 'custom':
                await handleCustom(interaction);
                break;
            case 'reset':
                await handleReset(interaction);
                break;
            case 'info':
                await handleInfo(interaction);
                break;
        }
    }
};

// Preset status handler
async function handlePreset(interaction) {
    const preset = interaction.options.getString('type');
    const client = interaction.client;
    
    const presets = {
        gaming: {
            name: 'with Discord API',
            type: ActivityType.Playing,
            status: 'online'
        },
        listening: {
            name: '/help commands',
            type: ActivityType.Listening,
            status: 'online'
        },
        watching: {
            name: `${client.guilds.cache.size} servers`,
            type: ActivityType.Watching,
            status: 'online'
        },
        thinking: {
            name: 'deep thoughts',
            type: ActivityType.Custom,
            status: 'idle',
            state: '🤔 Thinking...'
        },
        busy: {
            name: 'with moderation',
            type: ActivityType.Playing,
            status: 'dnd'
        },
        afk: {
            name: '💤 zzz...',
            type: ActivityType.Custom,
            status: 'idle',
            state: 'AFK Mode'
        },
        party: {
            name: 'a party! 🎉',
            type: ActivityType.Playing,
            status: 'online'
        },
        coding: {
            name: 'with JavaScript',
            type: ActivityType.Playing,
            status: 'online'
        },
        dj: {
            name: 'your favorite tunes',
            type: ActivityType.Listening,
            status: 'online'
        },
        mod: {
            name: 'for rule breakers',
            type: ActivityType.Watching,
            status: 'dnd'
        }
    };

    const presetData = presets[preset];
    
    try {
        // Set bot status
        client.user.setStatus(presetData.status);
        
        // Set activity
        if (presetData.type === ActivityType.Custom) {
            client.user.setActivity({
                name: presetData.name,
                state: presetData.state,
                type: presetData.type
            });
        } else if (presetData.type === ActivityType.Streaming) {
            client.user.setActivity({
                name: presetData.name,
                type: presetData.type,
                url: 'https://twitch.tv/discord'
            });
        } else {
            client.user.setActivity({
                name: presetData.name,
                type: presetData.type
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('✅ Status Updated!')
            .addFields(
                { name: '🎭 Preset', value: getPresetDisplayName(preset), inline: true },
                { name: '📝 Activity', value: presetData.name, inline: true },
                { name: '🟢 Status', value: presetData.status.toUpperCase(), inline: true },
                { name: '🎮 Type', value: getActivityTypeName(presetData.type), inline: true }
            )
            .setFooter({ 
                text: `Status updated by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Status update error:', error);
        await interaction.reply({
            content: '❌ Failed to update status. Check console for details.',
            ephemeral: true
        });
    }
}

// Custom status handler
async function handleCustom(interaction) {
    const activityType = interaction.options.getString('activity');
    const text = interaction.options.getString('text');
    const url = interaction.options.getString('url');
    const client = interaction.client;

    // Text validation
    if (text.length > 128) {
        return interaction.reply({
            content: '❌ Status text cannot exceed 128 characters!',
            ephemeral: true
        });
    }

    try {
        const activityTypeMap = {
            playing: ActivityType.Playing,
            listening: ActivityType.Listening,
            watching: ActivityType.Watching,
            competing: ActivityType.Competing,
            streaming: ActivityType.Streaming
        };

        const type = activityTypeMap[activityType];

        if (type === ActivityType.Streaming && !url) {
            return interaction.reply({
                content: '❌ Streaming activity requires a URL!',
                ephemeral: true
            });
        }

        // Set activity
        if (type === ActivityType.Streaming) {
            client.user.setActivity({
                name: text,
                type: type,
                url: url
            });
        } else {
            client.user.setActivity({
                name: text,
                type: type
            });
        }

        // Set appropriate status
        let status = 'online';
        if (activityType === 'listening') status = 'idle';
        if (text.toLowerCase().includes('afk')) status = 'idle';
        if (text.toLowerCase().includes('busy')) status = 'dnd';
        
        client.user.setStatus(status);

        const embed = new EmbedBuilder()
            .setColor('#45B7D1')
            .setTitle('✅ Custom Status Set!')
            .addFields(
                { name: '📝 Activity', value: text, inline: true },
                { name: '🎮 Type', value: getActivityTypeName(type), inline: true },
                { name: '🟢 Status', value: status.toUpperCase(), inline: true }
            )
            .setFooter({ 
                text: `Custom status by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        if (url) {
            embed.addFields({ name: '🔗 URL', value: url, inline: true });
        }

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Custom status error:', error);
        await interaction.reply({
            content: '❌ Failed to set custom status. Check console for details.',
            ephemeral: true
        });
    }
}

// Reset handler
async function handleReset(interaction) {
    const client = interaction.client;
    
    try {
        // Reset to default
        client.user.setStatus('online');
        client.user.setActivity({
            name: `${client.guilds.cache.size} servers`,
            type: ActivityType.Watching
        });

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🔄 Status Reset')
            .setDescription('Bot status has been reset to default.')
            .addFields(
                { name: '📝 Activity', value: `${client.guilds.cache.size} servers`, inline: true },
                { name: '🎮 Type', value: 'Watching', inline: true },
                { name: '🟢 Status', value: 'ONLINE', inline: true }
            )
            .setFooter({ 
                text: `Reset by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Reset status error:', error);
        await interaction.reply({
            content: '❌ Failed to reset status.',
            ephemeral: true
        });
    }
}

// Info handler
async function handleInfo(interaction) {
    const client = interaction.client;
    const presence = client.user.presence;

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🤖 Bot Status Information')
        .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
        .addFields(
            { name: '👤 Bot Name', value: client.user.tag, inline: true },
            { name: '🆔 Bot ID', value: client.user.id, inline: true },
            { name: '🟢 Status', value: presence.status.toUpperCase(), inline: true },
            { name: '📝 Activity', value: presence.activities[0]?.name || 'None', inline: true },
            { name: '🎮 Type', value: presence.activities[0] ? getActivityTypeName(presence.activities[0].type) : 'None', inline: true },
            { name: '📊 Servers', value: client.guilds.cache.size.toString(), inline: true },
            { name: '👥 Users', value: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString(), inline: true },
            { name: '⏰ Uptime', value: formatUptime(client.uptime), inline: true }
        )
        .setFooter({ 
            text: `Kudumbasree Status System • Dev: ***RIO-SEC***`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Helper functions
function getPresetDisplayName(preset) {
    const displayNames = {
        gaming: '🎮 Gaming',
        listening: '🎵 Listening',
        watching: '🎬 Watching',
        thinking: '💭 Thinking',
        busy: '🚀 Busy',
        afk: '😴 AFK',
        party: '🎉 Party',
        coding: '👨‍💻 Coding',
        dj: '🎧 DJ Mode',
        mod: '🛡️ Moderation'
    };
    return displayNames[preset] || preset;
}

function getActivityTypeName(type) {
    const typeNames = {
        0: 'Playing',
        1: 'Streaming',
        2: 'Listening',
        3: 'Watching',
        4: 'Custom',
        5: 'Competing'
    };
    return typeNames[type] || 'Unknown';
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}