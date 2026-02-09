const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll-end')
        .setDescription('End a poll early')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('Poll message ID')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        
        try {
            const channel = interaction.channel;
            const message = await channel.messages.fetch(messageId);
            
            if (!message.embeds[0]?.title?.includes('Poll:')) {
                return interaction.reply({ 
                    content: '❌ This is not a poll message.',
                    ephemeral: true 
                });
            }

            const newEmbed = EmbedBuilder.from(message.embeds[0])
                .setColor('#e74c3c')
                .setTitle('⏹️ ' + message.embeds[0].title)
                .setDescription('**📊 POLL ENDED**\n\n' + message.embeds[0].description);

            await message.edit({ 
                embeds: [newEmbed],
                components: [] 
            });

            await interaction.reply({ 
                content: `✅ Poll ended successfully!`,
                ephemeral: true 
            });

        } catch (error) {
            await interaction.reply({ 
                content: `❌ Error: ${error.message}`,
                ephemeral: true 
            });
        }
    }
};