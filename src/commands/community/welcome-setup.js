const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Setup welcome messages for new members')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for welcome messages')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gif')
                .setDescription('GIF URL (optional, leave empty for default)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Welcome message (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Embed color hex (e.g., #FF6B6B)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('autorole')
                .setDescription('Auto-assign role to new members')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const channel = interaction.options.getChannel('channel');
            const gifUrl = interaction.options.getString('gif') || 
                'https://media.tenor.com/ISx2jQ5l8eAAAAAC/welcome.gif';
            const message = interaction.options.getString('message') || 
                "Welcome {user} to **{server}**! 🎉\nYou're member #{count}";
            const color = interaction.options.getString('color') || '#FF6B6B';
            const autoRole = interaction.options.getRole('autorole');
            
            // Initialize welcome system if not exists
            if (!interaction.client.welcomeSystem) {
                const WelcomeSystem = require('../../modules/welcomeSystem');
                interaction.client.welcomeSystem = new WelcomeSystem(interaction.client);
            }
            
            // Save configuration
            await interaction.client.welcomeSystem.setupWelcome(interaction.guild.id, channel.id, {
                message,
                gifUrl,
                embedColor: color,
                sendDM: true,
                autoRoleId: autoRole?.id
            });
            
            // Test embed creation
            const testEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎉 Welcome to Test Server!')
                .setDescription(message.replace(/{user}/g, interaction.user.toString())
                                      .replace(/{server}/g, interaction.guild.name)
                                      .replace(/{count}/g, interaction.guild.memberCount))
                .setImage(gifUrl)
                .setFooter({ text: 'Test Welcome Embed' })
                .setTimestamp();
            
            // Send test to current channel to verify GIF works
            await interaction.channel.send({ 
                content: '**Test Welcome Message:**',
                embeds: [testEmbed] 
            });
            
            // Send confirmation
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('✅ Welcome System Configured!')
                .setDescription(`Welcome messages will be sent to ${channel}`)
                .addFields(
                    { name: '📁 Channel', value: `${channel}`, inline: true },
                    { name: '🎨 Color', value: color, inline: true },
                    { name: '🎭 Auto-Role', value: autoRole ? `${autoRole}` : 'None', inline: true },
                    { name: '📝 Message', value: '```' + message.substring(0, 100) + '...```' },
                    { name: '🎬 GIF Preview', value: `[View GIF](${gifUrl})` }
                )
                .setFooter({ 
                    text: `Use /welcome-test to test the system`,
                    iconURL: interaction.guild.iconURL()
                });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Welcome setup error:', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}\n\nTry using a direct GIF URL like:\n\`https://media.tenor.com/ISx2jQ5l8eAAAAAC/welcome.gif\``,
                ephemeral: true
            });
        }
    }
};