const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-test')
        .setDescription('Test the welcome system')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of welcome to test')
                .addChoices(
                    { name: 'Member Join', value: 'join' },
                    { name: 'Server Boost', value: 'boost' }
                )
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const type = interaction.options.getString('type');
            
            if (!interaction.client.welcomeSystem) {
                const WelcomeSystem = require('../../modules/welcomeSystem');
                interaction.client.welcomeSystem = new WelcomeSystem(interaction.client);
            }
            
            if (type === 'join') {
                // Simulate member join
                await interaction.client.welcomeSystem.handleMemberJoin(interaction.member);
                await interaction.editReply({
                    content: '✅ Test welcome message sent! Check the welcome channel.',
                    ephemeral: true
                });
            } else if (type === 'boost') {
                // Simulate boost
                const mockMember = {
                    ...interaction.member,
                    premiumSince: new Date(),
                    guild: {
                        ...interaction.guild,
                        premiumSubscriptionCount: (interaction.guild.premiumSubscriptionCount || 0) + 1
                    }
                };
                
                await interaction.client.welcomeSystem.handleNewBoost(mockMember);
                await interaction.editReply({
                    content: '✅ Test booster message sent! Check the booster channel.',
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('Welcome test error:', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};