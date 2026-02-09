const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-stats')
        .setDescription('Show logging system statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            if (!interaction.client.loggingSystem) {
                return interaction.editReply({
                    content: '❌ Logging system not initialized. Use `/logs-setup` first.',
                    ephemeral: true
                });
            }
            
            const stats = interaction.client.loggingSystem.getLogStats(interaction.guild.id);
            
            if (!stats) {
                return interaction.editReply({
                    content: '❌ No logging system found for this server. Use `/logs-setup` to create one.',
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x3498db)
                .setTitle('📊 Logging System Statistics')
                .setDescription(`**Premium logging system for ${interaction.guild.name}**`)
                .addFields(
                    { name: '📈 Total Log Channels', value: stats.totalChannels.toString(), inline: true },
                    { name: '🔄 Status', value: '✅ Active', inline: true },
                    { name: '📡 Events Logged', value: '24/7 Real-time', inline: true },
                    { name: '​', value: '​', inline: false }
                )
                .setFooter({ 
                    text: 'Kudumbasree Premium Logging • Auto-detects all events',
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            // Add channel info
            Object.entries(stats.channels).forEach(([type, info]) => {
                embed.addFields({
                    name: `${this.getChannelEmoji(type)} ${type} Logs`,
                    value: `**Channel:** <#${info.id}>\n**Name:** ${info.name}\n**Created:** <t:${Math.floor(info.created.getTime()/1000)}:R>`,
                    inline: false
                });
            });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Log stats error:', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    },
    
    getChannelEmoji(type) {
        const emojis = {
            'VOICE': '🔊',
            'MESSAGE': '📝',
            'MEMBER': '👥',
            'STATUS': '🎤',
            'MODERATION': '⚙️'
        };
        return emojis[type] || '📁';
    }
};