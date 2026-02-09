const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Setup welcome & booster messages with GIFs')
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Setup welcome messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for welcome messages')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('gif')
                        .setDescription('GIF URL for welcome message')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message template')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Embed color (hex code)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('dm')
                        .setDescription('Send welcome DM to new members')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('autorole')
                        .setDescription('Auto-assign role to new members')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('booster')
                .setDescription('Setup booster announcement messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for booster announcements')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('gif')
                        .setDescription('GIF URL for booster messages')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Booster message template')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('ping')
                        .setDescription('Role to ping on new boost')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview welcome/booster messages')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type to preview')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome Message', value: 'welcome' },
                            { name: 'Booster Message', value: 'booster' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test welcome/booster message')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type to test')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome', value: 'welcome' },
                            { name: 'Booster', value: 'booster' }
                        ))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client;

        // Ensure welcome system is initialized
        if (!client.welcomeSystem) {
            client.welcomeSystem = new (require('../../modules/welcomeSystem'))(client);
        }

        switch (subcommand) {
            case 'welcome':
                await setupWelcome(interaction, client.welcomeSystem);
                break;
            case 'booster':
                await setupBooster(interaction, client.welcomeSystem);
                break;
            case 'preview':
                await previewMessage(interaction, client.welcomeSystem);
                break;
            case 'test':
                await testMessage(interaction, client.welcomeSystem);
                break;
        }
    }
};

async function setupWelcome(interaction, welcomeSystem) {
    const channel = interaction.options.getChannel('channel');
    const gifUrl = interaction.options.getString('gif') || 'https://tenor.com/en-GB/view/anime-gif-20554541';
    const message = interaction.options.getString('message') || 
        "Welcome {user} to **{server}**! 🎉\nYou're member #{count}\n\n🎮 Have fun and enjoy your stay!";
    const color = interaction.options.getString('color') || '#FF6B6B';
    const sendDM = interaction.options.getBoolean('dm') ?? true;
    const autoRole = interaction.options.getRole('autorole');

    // Save configuration
    await welcomeSystem.setupWelcome(interaction.guild.id, channel.id, {
        message,
        gifUrl,
        embedColor: color,
        sendDM,
        autoRoleId: autoRole?.id
    });

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('✅ Welcome System Configured!')
        .setDescription(`Welcome messages will be sent to ${channel}`)
        .addFields(
            { name: '📁 Channel', value: `${channel}`, inline: true },
            { name: '🎨 Color', value: color, inline: true },
            { name: '📨 Send DM', value: sendDM ? '✅ Yes' : '❌ No', inline: true },
            { name: '🎭 Auto-Role', value: autoRole ? `${autoRole}` : '❌ None', inline: true },
            { name: '🎬 GIF URL', value: `[View GIF](${gifUrl})`, inline: false },
            { name: '📝 Message Template', value: '```' + message.substring(0, 500) + '```', inline: false }
        )
        .setFooter({ 
            text: `Kudumbasree Welcome System • Variables: {user} {server} {count} {username}`,
            iconURL: interaction.guild.iconURL()
        });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function setupBooster(interaction, welcomeSystem) {
    const channel = interaction.options.getChannel('channel');
    const gifUrl = interaction.options.getString('gif') || 'https://tenor.com/en-GB/view/gay-gay-cop-gay-cops-gay-police-gay-durango-gif-10039269045960132047';
    const message = interaction.options.getString('message') || 
        "{user} just boosted **{server}**! 🚀\n**Level:** {boostLevel}\n**Total Boosts:** {totalBoosts}\n\n🎁 Thank you for the support!";
    const pingRole = interaction.options.getRole('ping');

    // Save configuration
    await welcomeSystem.setupBoosterLogs(interaction.guild.id, channel.id, {
        message,
        gifUrl,
        embedColor: '#9b59b6',
        pingRole: pingRole?.id
    });

    const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('✅ Booster System Configured!')
        .setDescription(`Booster announcements will be sent to ${channel}`)
        .addFields(
            { name: '📁 Channel', value: `${channel}`, inline: true },
            { name: '🎭 Ping Role', value: pingRole ? `${pingRole}` : '❌ None', inline: true },
            { name: '🎬 GIF URL', value: `[View GIF](${gifUrl})`, inline: false },
            { name: '📝 Message Template', value: '```' + message.substring(0, 500) + '```', inline: false },
            { name: '✨ Variables', value: '`{user}` - Booster mention\n`{server}` - Server name\n`{boostLevel}` - Boost tier\n`{totalBoosts}` - Total boost count', inline: false }
        )
        .setFooter({ 
            text: 'Booster messages will auto-send when members boost!',
            iconURL: interaction.guild.iconURL()
        });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function previewMessage(interaction, welcomeSystem) {
    const type = interaction.options.getString('type');
    
    if (type === 'welcome') {
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🎉 Welcome to Server Name!')
            .setDescription("Welcome <@123456789> to **Server Name**! 🎉\nYou're member #150\n\n🎮 Have fun and enjoy your stay!")
            .setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
            .setImage('https://tenor.com/en-GB/view/anime-gif-20554541')
            .addFields(
                { name: '👤 Account Created', value: '<t:1625097600:R>', inline: true },
                { name: '📅 Joined', value: '<t:1625097600:R>', inline: true },
                { name: '👥 Member Count', value: '#150', inline: true }
            )
            .setFooter({ 
                text: 'Kudumbasree Welcome System • Server Name',
                iconURL: 'https://cdn.discordapp.com/icons/123456789/abcdefg.png'
            })
            .setTimestamp();

        await interaction.reply({ 
            content: '**Preview: Welcome Message**\n(With mentions: <@123456789>)',
            embeds: [embed], 
            ephemeral: true 
        });
    } else {
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🚀 NEW SERVER BOOSTER!')
            .setDescription("<@123456789> just boosted **Server Name**! 🚀\n**Level:** 2\n**Total Boosts:** 25\n\n🎁 Thank you for the support!")
            .setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
            .setImage('https://tenor.com/en-GB/view/gay-gay-cop-gay-cops-gay-police-gay-durango-gif-10039269045960132047')
            .addFields(
                { name: '👤 Booster', value: '<@123456789>', inline: true },
                { name: '⭐ Boost Level', value: 'Tier 2', inline: true },
                { name: '📈 Total Boosts', value: '25', inline: true },
                { name: '🎁 Benefits', value: 'Special roles & perks unlocked!', inline: false }
            )
            .setFooter({ 
                text: 'Server Name Booster System',
                iconURL: 'https://cdn.discordapp.com/icons/123456789/abcdefg.png'
            })
            .setTimestamp();

        await interaction.reply({ 
            content: '**Preview: Booster Announcement**\n(With mentions: <@123456789>)',
            embeds: [embed], 
            ephemeral: true 
        });
    }
}

async function testMessage(interaction, welcomeSystem) {
    const type = interaction.options.getString('type');
    
    if (type === 'welcome') {
        // Simulate member join
        await welcomeSystem.handleMemberJoin(interaction.member);
        await interaction.reply({ 
            content: '✅ Test welcome message sent to configured channel!',
            ephemeral: true 
        });
    } else {
        // Simulate boost
        const oldMember = { ...interaction.member, premiumSince: null };
        const newMember = { ...interaction.member, premiumSince: new Date() };
        newMember.guild = interaction.guild;
        newMember.guild.premiumSubscriptionCount = (interaction.guild.premiumSubscriptionCount || 0) + 1;
        
        await welcomeSystem.handleNewBoost(newMember);
        await interaction.reply({ 
            content: '✅ Test booster announcement sent to configured channel!',
            ephemeral: true 
        });
    }
}