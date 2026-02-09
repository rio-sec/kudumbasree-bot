const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status-manager')
        .setDescription('Manage auto-rotating statuses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all rotating statuses')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new rotating status')
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('Status text')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Activity type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Playing', value: 'playing' },
                            { name: 'Listening', value: 'listening' },
                            { name: 'Watching', value: 'watching' },
                            { name: 'Streaming', value: 'streaming' },
                            { name: 'Custom', value: 'custom' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('state')
                        .setDescription('Custom state (for custom type only)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a rotating status')
                .addIntegerOption(option =>
                    option
                        .setName('index')
                        .setDescription('Status index (use /status-manager list to see)')
                        .setRequired(true)
                        .setMinValue(0)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('interval')
                .setDescription('Set rotation interval')
                .addIntegerOption(option =>
                    option
                        .setName('minutes')
                        .setDescription('Minutes between rotations (1-60)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(60)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle auto-rotation on/off')
        )
        .setDefaultMemberPermissions(0) // Owner only
        .setDMPermission(false),

    async execute(interaction) {
        const BOT_OWNER_ID = process.env.BOT_OWNER_ID || interaction.user.id;
        if (interaction.user.id !== BOT_OWNER_ID) {
            return interaction.reply({
                content: '❌ This command is for bot owner only!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const statusRotator = interaction.client.statusRotator;

        switch (subcommand) {
            case 'list':
                await handleList(interaction, statusRotator);
                break;
            case 'add':
                await handleAdd(interaction, statusRotator);
                break;
            case 'remove':
                await handleRemove(interaction, statusRotator);
                break;
            case 'interval':
                await handleInterval(interaction, statusRotator);
                break;
            case 'toggle':
                await handleToggle(interaction, statusRotator);
                break;
        }
    }
};

async function handleList(interaction, rotator) {
    const statuses = rotator.getStatusList();
    const current = rotator.getCurrentStatus();

    const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🔄 Rotating Status List')
        .setDescription(`Currently ${rotator.enabled ? '✅ Enabled' : '❌ Disabled'}\nInterval: ${rotator.rotationInterval / 60000} minutes`)
        .setFooter({ text: 'Use /status-manager add to add new statuses' });

    if (current) {
        embed.addFields({
            name: '🎮 Current Status',
            value: `**${current.name}**\nType: ${current.type}\nStatus: ${current.status.toUpperCase()}`,
            inline: false
        });
    }

    if (statuses.length > 0) {
        const statusList = statuses.map(s => 
            `${s.current ? '**▶️' : '▫️'} ${s.index}.** ${s.name}\n   └─ ${s.type} • ${s.status.toUpperCase()}`
        ).join('\n\n');

        embed.addFields({
            name: `📋 All Statuses (${statuses.length})`,
            value: statusList.length > 1024 ? statusList.slice(0, 1000) + '...' : statusList,
            inline: false
        });
    } else {
        embed.addFields({
            name: '📋 Statuses',
            value: 'No statuses configured. Use `/status-manager add` to add some!',
            inline: false
        });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleAdd(interaction, rotator) {
    const text = interaction.options.getString('text');
    const type = interaction.options.getString('type');
    const state = interaction.options.getString('state');

    rotator.addStatus(text, type, 'online');

    const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Status Added!')
        .addFields(
            { name: '📝 Text', value: text, inline: true },
            { name: '🎮 Type', value: type, inline: true },
            { name: '🟢 Status', value: 'ONLINE', inline: true }
        )
        .setFooter({ text: `Total statuses: ${rotator.statuses.length}` });

    if (state && type === 'custom') {
        embed.addFields({ name: '💭 Custom State', value: state, inline: false });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRemove(interaction, rotator) {
    const index = interaction.options.getInteger('index');

    if (index >= rotator.statuses.length) {
        return interaction.reply({
            content: `❌ Invalid index! Maximum is ${rotator.statuses.length - 1}`,
            ephemeral: true
        });
    }

    const removed = rotator.statuses.splice(index, 1)[0];

    const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('🗑️ Status Removed')
        .addFields(
            { name: '📝 Text', value: removed.name, inline: true },
            { name: '🎮 Type', value: removed.type, inline: true },
            { name: '📊 Remaining', value: rotator.statuses.length.toString(), inline: true }
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleInterval(interaction, rotator) {
    const minutes = interaction.options.getInteger('minutes');
    const ms = minutes * 60000;

    rotator.setRotationInterval(ms);

    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('⏱️ Rotation Interval Updated')
        .setDescription(`Status will rotate every **${minutes} minute${minutes !== 1 ? 's' : ''}**`)
        .addFields(
            { name: '📊 Interval', value: `${minutes} minutes`, inline: true },
            { name: '🔄 In Milliseconds', value: `${ms}ms`, inline: true }
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleToggle(interaction, rotator) {
    if (rotator.enabled) {
        rotator.disable();
        var message = '❌ Auto-rotation disabled';
    } else {
        rotator.enable();
        var message = '✅ Auto-rotation enabled';
    }

    await interaction.reply({
        content: message,
        ephemeral: true
    });
}