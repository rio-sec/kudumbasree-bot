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
            option.setName('color')
                .setDescription('Embed color (e.g., Red, Blue, Green, or #FF6B6B)')
                .addChoices(
                    { name: 'Red', value: 'Red' },
                    { name: 'Blue', value: 'Blue' },
                    { name: 'Green', value: 'Green' },
                    { name: 'Yellow', value: 'Yellow' },
                    { name: 'Purple', value: 'Purple' },
                    { name: 'Orange', value: 'Orange' },
                    { name: 'Pink', value: 'Pink' },
                    { name: 'Cyan', value: 'Cyan' },
                    { name: 'White', value: 'White' },
                    { name: 'Random', value: 'Random' }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('gif')
                .setDescription('GIF URL (optional) - Use direct .gif link')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Welcome message (optional)')
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
            const colorChoice = interaction.options.getString('color') || 'Random';
            const gifUrl = interaction.options.getString('gif') || 
                'https://media.tenor.com/ISx2jQ5l8eAAAAAC/welcome.gif';
            const message = interaction.options.getString('message') || 
                "Welcome {user} to **{server}**! 🎉\nYou're member #{count}";
            const autoRole = interaction.options.getRole('autorole');
            
            // Convert color name to hex
            const colorMap = {
                'Red': '#FF0000',
                'Blue': '#0000FF',
                'Green': '#00FF00',
                'Yellow': '#FFFF00',
                'Purple': '#800080',
                'Orange': '#FFA500',
                'Pink': '#FFC0CB',
                'Cyan': '#00FFFF',
                'White': '#FFFFFF',
                'Random': this.getRandomColor()
            };
            
            const colorHex = colorMap[colorChoice] || '#FF6B6B';
            
            // Initialize welcome system if not exists
            if (!interaction.client.welcomeSystem) {
                const WelcomeSystem = require('../../modules/welcomeSystem');
                interaction.client.welcomeSystem = new WelcomeSystem(interaction.client);
            }
            
            // Save configuration
            await interaction.client.welcomeSystem.setupWelcome(interaction.guild.id, channel.id, {
                message,
                gifUrl,
                embedColor: colorHex,
                sendDM: true,
                autoRoleId: autoRole?.id
            });
            
            // Create confirmation embed
            const embed = new EmbedBuilder()
                .setColor(colorHex)
                .setTitle('✅ Welcome System Configured!')
                .setDescription(`Welcome messages will be sent to ${channel}`)
                .addFields(
                    { name: '📁 Channel', value: `${channel}`, inline: true },
                    { name: '🎨 Color', value: colorChoice, inline: true },
                    { name: '🎭 Auto-Role', value: autoRole ? `${autoRole}` : 'None', inline: true },
                    { name: '📝 Message', value: '```' + message.substring(0, 100) + '...```', inline: false },
                    { name: '🎬 GIF', value: `[View GIF](${gifUrl})`, inline: false },
                    { name: '✨ Variables', value: '`{user}` - Member mention\n`{server}` - Server name\n`{count}` - Member count', inline: false }
                )
                .setImage(gifUrl)
                .setFooter({ 
                    text: `Use /welcome-test to test the system`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Send test message to the channel
            const testEmbed = new EmbedBuilder()
                .setColor(colorHex)
                .setTitle('🎉 Test Welcome Message')
                .setDescription(message.replace(/{user}/g, interaction.user.toString())
                                      .replace(/{server}/g, interaction.guild.name)
                                      .replace(/{count}/g, interaction.guild.memberCount))
                .setImage(gifUrl)
                .setFooter({ text: 'This is a test welcome message' })
                .setTimestamp();
            
            await channel.send({ 
                content: `${interaction.user} Test welcome message:`,
                embeds: [testEmbed] 
            });
            
        } catch (error) {
            console.error('Welcome setup error:', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}\n\n**Try these fixes:**\n1. Use color from dropdown menu\n2. Use direct GIF URL ending with .gif\n3. Check bot permissions in ${channel}`,
                ephemeral: true
            });
        }
    },
    
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#9B59B6', '#3498DB', '#E74C3C'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};