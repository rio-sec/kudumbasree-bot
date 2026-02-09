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
                .setDescription('Choose a color')
                .addChoices(
                    { name: '🔴 Red', value: 'Red' },
                    { name: '🔵 Blue', value: 'Blue' },
                    { name: '🟢 Green', value: 'Green' },
                    { name: '🟡 Yellow', value: 'Yellow' },
                    { name: '🟣 Purple', value: 'Purple' },
                    { name: '🎨 Random', value: 'Random' }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('gif')
                .setDescription('Choose a GIF theme')
                .addChoices(
                    { name: '🎉 Party Welcome', value: 'party' },
                    { name: '🤖 Anime Welcome', value: 'anime' },
                    { name: '🎮 Gaming Welcome', value: 'gaming' },
                    { name: '✨ Sparkle Welcome', value: 'sparkle' },
                    { name: '👋 Wave Welcome', value: 'wave' }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Custom welcome message (optional)')
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
            const colorChoice = interaction.options.getString('color') || 'Red';
            const gifChoice = interaction.options.getString('gif') || 'party';
            const customMessage = interaction.options.getString('message');
            const autoRole = interaction.options.getRole('autorole');
            
            // Color mapping (using Discord.js ColorResolvable)
            const colors = {
                'Red': 'Red',
                'Blue': 'Blue', 
                'Green': 'Green',
                'Yellow': 'Yellow',
                'Purple': 'Purple',
                'Random': this.getRandomColor()
            };
            
            // WORKING GIF URLs (Discord-compatible)
            const gifs = {
                'party': 'https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
                'anime': 'https://i.giphy.com/media/26tknCqiJrBQG6DrC/giphy.gif',
                'gaming': 'https://i.giphy.com/media/l0HU7JI1uHRQmQqk0/giphy.gif',
                'sparkle': 'https://i.giphy.com/media/xT8qBhrlNooHBYR9f6/giphy.gif',
                'wave': 'https://i.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif'
            };
            
            const color = colors[colorChoice];
            const gifUrl = gifs[gifChoice];
            
            // Default message
            const message = customMessage || 
                "🎉 **Welcome {user} to {server}!** 🎉\n\n" +
                "✨ You're member **#{count}**\n" +
                "📅 Account created: <t:{created}:R>\n" +
                "👥 **Enjoy your stay!**";
            
            // Initialize welcome system
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
            
            // Create PREVIEW embed (this will show GIF)
            const previewEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎉 **WELCOME PREVIEW**')
                .setDescription(message
                    .replace(/{user}/g, interaction.user.toString())
                    .replace(/{server}/g, interaction.guild.name)
                    .replace(/{count}/g, interaction.guild.memberCount)
                    .replace(/{created}/g, Math.floor(interaction.user.createdTimestamp/1000))
                )
                .setImage(gifUrl)  // This should load now
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: `Welcome System • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            // Send preview to current channel (so you can see GIF)
            await interaction.channel.send({ 
                content: `**🎊 WELCOME SYSTEM PREVIEW**\nConfigured by ${interaction.user}`,
                embeds: [previewEmbed] 
            });
            
            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('✅ **WELCOME SYSTEM CONFIGURED!**')
                .setDescription(`Welcome messages will be sent to ${channel}`)
                .addFields(
                    { name: '📁 Channel', value: `${channel}`, inline: true },
                    { name: '🎨 Color', value: colorChoice, inline: true },
                    { name: '🎬 GIF Theme', value: gifChoice, inline: true },
                    { name: '🎭 Auto-Role', value: autoRole ? `${autoRole}` : 'None', inline: true },
                    { name: '📝 Message', value: '```' + message.substring(0, 150) + '...```', inline: false },
                    { name: '✨ Variables', value: '`{user}` - Member\n`{server}` - Server\n`{count}` - #Member\n`{created}` - Account age', inline: false }
                )
                .setThumbnail(gifUrl)
                .setFooter({ 
                    text: 'Next member will receive this welcome automatically!',
                    iconURL: interaction.guild.iconURL()
                });
            
            await interaction.editReply({ embeds: [confirmEmbed] });
            
            console.log(`✅ Welcome setup complete for ${interaction.guild.name}`);
            console.log(`🎬 GIF URL used: ${gifUrl}`);
            
        } catch (error) {
            console.error('Welcome setup error:', error);
            await interaction.editReply({
                content: `❌ **Error:** ${error.message}\n\n**Quick fix:**\n1. Try different GIF theme\n2. Check channel permissions\n3. Use simpler message`,
                ephemeral: true
            });
        }
    },
    
    getRandomColor() {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};