const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, PermissionOverwrites } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs-setup')
        .setDescription('Setup premium logging system with 5 auto-created channels')
        .addRoleOption(option =>
            option.setName('modrole')
                .setDescription('Role that can view logs (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const modRole = interaction.options.getRole('modrole');
            const guild = interaction.guild;
            
            // Check bot permissions
            const requiredPerms = [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.SendMessages
            ];
            
            const missingPerms = requiredPerms.filter(perm => 
                !guild.members.me.permissions.has(perm)
            );
            
            if (missingPerms.length > 0) {
                return interaction.editReply({
                    content: `❌ **Missing Permissions:**\n${missingPerms.map(p => `• ${p}`).join('\n')}\n\nPlease grant these permissions to the bot.`,
                    ephemeral: true
                });
            }
            
            // Initialize logging system
            if (!interaction.client.loggingSystem) {
                const LoggingSystem = require('../../modules/loggingSystem');
                interaction.client.loggingSystem = new LoggingSystem(interaction.client);
            }
            
            // Check if logs already exist
            const existingChannels = await interaction.client.loggingSystem.initializeGuild(guild);
            
            if (existingChannels && Object.keys(existingChannels).length >= 3) {
                const embed = new EmbedBuilder()
                    .setColor(0x9b59b6)
                    .setTitle('📊 Logging System Already Setup')
                    .setDescription('Premium logging system is already active!')
                    .addFields(
                        { name: '🔊 Voice Logs', value: existingChannels.VOICE ? `${existingChannels.VOICE}` : '❌ Missing', inline: true },
                        { name: '📝 Message Logs', value: existingChannels.MESSAGE ? `${existingChannels.MESSAGE}` : '❌ Missing', inline: true },
                        { name: '👥 Member Logs', value: existingChannels.MEMBER ? `${existingChannels.MEMBER}` : '❌ Missing', inline: true },
                        { name: '🎤 VC Status Logs', value: existingChannels.STATUS ? `${existingChannels.STATUS}` : '❌ Missing', inline: true },
                        { name: '⚙️ Moderation Logs', value: existingChannels.MODERATION ? `${existingChannels.MODERATION}` : '❌ Missing', inline: true }
                    )
                    .setFooter({ text: 'Auto-logging is active for all events' });
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            // Create all log channels
            const channels = await interaction.client.loggingSystem.createAllLogChannels(guild, modRole);
            
            // Setup listeners
            interaction.client.loggingSystem.setupListeners();
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('✅ **PREMIUM LOGGING SYSTEM ACTIVATED!**')
                .setDescription('**5 dedicated log channels created with premium embeds**\n\nAll events are now being automatically logged in real-time.')
                .addFields(
                    { name: '📁 Category', value: '`📊 KUDUMNBASREE LOGS`', inline: true },
                    { name: '📈 Total Channels', value: '5', inline: true },
                    { name: '🛡️ View Access', value: modRole ? `${modRole}` : 'Admins only', inline: true },
                    { name: '​', value: '​', inline: false }, // Spacer
                    { name: '🔊 Voice Logs', value: `${channels.VOICE}\n• Voice Join/Leave/Move\n• Channel switches`, inline: false },
                    { name: '📝 Message Logs', value: `${channels.MESSAGE}\n• Message Delete/Edit\n• Bulk deletions`, inline: false },
                    { name: '👥 Member Logs', value: `${channels.MEMBER}\n• Member Join/Leave\n• Nickname changes\n• Profile updates`, inline: false },
                    { name: '🎤 VC Status Logs', value: `${channels.STATUS}\n• Voice Mute/Deafen\n• Server Mute/Deafen\n• Stream start/end`, inline: false },
                    { name: '⚙️ Moderation Logs', value: `${channels.MODERATION}\n• Role Add/Remove\n• Bans/Kicks/Timeouts\n• Channel updates`, inline: false }
                )
                .setFooter({ 
                    text: `Kudumbasree Premium Logging • Auto-logging 24/7`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            
            // Send test logs
            setTimeout(async () => {
                try {
                    // Test voice log
                    await interaction.client.loggingSystem.log('VOICE_JOIN', {
                        user: interaction.user,
                        channel: interaction.channel,
                        guild: interaction.guild
                    });
                    
                    // Test member log
                    await interaction.client.loggingSystem.log('MEMBER_JOIN', {
                        user: interaction.user,
                        guild: interaction.guild
                    });
                    
                    console.log(`✅ Test logs sent for ${guild.name}`);
                } catch (testError) {
                    console.log('Test logs skipped:', testError.message);
                }
            }, 2000);
            
        } catch (error) {
            console.error('Logs setup error:', error);
            await interaction.editReply({
                content: `❌ **Setup Failed:** ${error.message}\n\n**Required Bot Permissions:**\n• Manage Channels\n• Manage Roles\n• Send Messages\n• Embed Links\n\nPlease grant these permissions and try again.`,
                ephemeral: true
            });
        }
    }
};