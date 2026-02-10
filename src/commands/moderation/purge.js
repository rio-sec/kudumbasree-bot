const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete multiple messages at once')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for purging messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            let messages;
            
            if (targetUser) {
                // Fetch messages and filter by user
                const fetched = await interaction.channel.messages.fetch({ limit: 100 });
                messages = fetched.filter(msg => msg.author.id === targetUser.id);
                
                // Take only the requested amount
                messages = Array.from(messages.values()).slice(0, amount);
            } else {
                // Fetch recent messages
                messages = await interaction.channel.messages.fetch({ limit: amount });
                messages = Array.from(messages.values());
            }
            
            // Delete messages
            const deleted = await interaction.channel.bulkDelete(messages, true);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('🗑️ Messages Purged')
                .setDescription(`Successfully deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}`)
                .addFields(
                    { name: '📁 Channel', value: `${interaction.channel}`, inline: true },
                    { name: '👤 Moderator', value: `${interaction.user}`, inline: true },
                    { name: '👤 Target User', value: targetUser ? `${targetUser}` : 'All Users', inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setFooter({ 
                    text: `Purge completed • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Log to moderation channel if logging system exists
            if (interaction.client.loggingSystem) {
                await interaction.client.loggingSystem.log('BULK_DELETE', {
                    moderator: interaction.user,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    count: deleted.size,
                    targetUser: targetUser,
                    reason: reason
                });
            }
            
        } catch (error) {
            console.error('Purge error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Purge Failed')
                .setDescription(`Error: ${error.message}`)
                .addFields(
                    { name: '💡 Tip', value: 'Messages older than 14 days cannot be bulk deleted.', inline: false }
                );
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};