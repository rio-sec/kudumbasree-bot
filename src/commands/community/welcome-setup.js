const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Setup welcome messages with CUSTOM GIFs')
        // REQUIRED options FIRST
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for welcome messages')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gif_type')
                .setDescription('Choose GIF type')
                .addChoices(
                    { name: '🎉 Party GIF', value: 'party' },
                    { name: '🤖 Anime GIF', value: 'anime' },
                    { name: '🎮 Gaming GIF', value: 'gaming' },
                    { name: '✨ Sparkle GIF', value: 'sparkle' },
                    { name: '👋 Wave GIF', value: 'wave' },
                    { name: '💖 Custom GIF', value: 'custom' }
                )
                .setRequired(true))  // This is REQUIRED, so it's fine here
        // OPTIONAL options AFTER required ones
        .addStringOption(option =>
            option.setName('custom_gif')
                .setDescription('Paste YOUR custom GIF URL (Required if custom type)')
                .setRequired(false))  // Optional comes after required
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Choose a color')
                .addChoices(
                    { name: '🔴 Red', value: 'Red' },
                    { name: '🔵 Blue', value: 'Blue' },
                    { name: '🟢 Green', value: 'Green' },
                    { name: '🟡 Yellow', value: 'Yellow' },
                    { name: '🟣 Purple', value: 'Purple' },
                    { name: '🧡 Orange', value: 'Orange' },
                    { name: '💗 Pink', value: 'Pink' },
                    { name: '🎨 Random', value: 'Random' }
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
            const gifType = interaction.options.getString('gif_type');
            const customGifUrl = interaction.options.getString('custom_gif');
            const colorChoice = interaction.options.getString('color') || 'Red';
            const customMessage = interaction.options.getString('message');
            const autoRole = interaction.options.getRole('autorole');
            
            // Color mapping
            const colors = {
                'Red': 'Red',
                'Blue': 'Blue', 
                'Green': 'Green',
                'Yellow': 'Yellow',
                'Purple': 'Purple',
                'Orange': 'Orange',
                'Pink': 'Pink',
                'Random': this.getRandomColor()
            };
            
            // GIF library - WORKING GIFs
            const gifLibrary = {
                'party': 'https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
                'anime': 'https://i.giphy.com/media/26tknCqiJrBQG6DrC/giphy.gif',
                'gaming': 'https://i.giphy.com/media/l0HU7JI1uHRQmQqk0/giphy.gif',
                'sparkle': 'https://i.giphy.com/media/xT8qBhrlNooHBYR9f6/giphy.gif',
                'wave': 'https://i.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif'
            };
            
            // Determine GIF URL
            let gifUrl;
            if (gifType === 'custom') {
                if (!customGifUrl) {
                    return interaction.editReply({
                        content: '❌ **Custom GIF URL is required when choosing "Custom GIF" type!**\n\nPlease provide a direct GIF URL like:\n`https://media.tenor.com/your-gif-id.gif`\n`https://i.giphy.com/media/xxxxx/giphy.gif`',
                        ephemeral: true
                    });
                }
                gifUrl = this.validateAndFixGifUrl(customGifUrl);
            } else {
                gifUrl = gifLibrary[gifType];
            }
            
            // Validate GIF URL
            const isValid = await this.validateGifUrl(gifUrl);
            if (!isValid) {
                return interaction.editReply({
                    content: `❌ **Invalid GIF URL!**\n\nPlease provide a DIRECT GIF URL that ends with .gif\n\n**Examples:**\n\`https://media.tenor.com/XXXXX.gif\`\n\`https://i.giphy.com/media/XXXXX/giphy.gif\`\n\`https://cdn.discordapp.com/attachments/XXXXX/XXXXX.gif\``,
                    ephemeral: true
                });
            }
            
            const color = colors[colorChoice];
            
            // Default message with variables
            const defaultMessage = 
                "🎉 **WELCOME {user} TO {server}!** 🎉\n\n" +
                "✨ You're our **#{count}** member!\n" +
                "📅 Joined: <t:{timestamp}:R>\n" +
                "👤 Account age: <t:{created}:R>\n\n" +
                "**Enjoy your stay!** ❤️";
            
            const message = customMessage || defaultMessage;
            
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
            
            // **TEST: Send preview with the ACTUAL GIF**
            const previewEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('🎉 **WELCOME PREVIEW**')
                .setDescription(this.formatMessage(message, interaction.user, interaction.guild))
                .setImage(gifUrl)  // Your custom GIF here!
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ 
                    text: `Custom Welcome System • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
            
            // Send preview to current channel
            await interaction.channel.send({ 
                content: `**🎊 CUSTOM WELCOME PREVIEW**\nConfigured by ${interaction.user}`,
                embeds: [previewEmbed] 
            });
            
            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('✅ **CUSTOM WELCOME SYSTEM READY!**')
                .setDescription(`**Custom welcome messages activated in ${channel}**`)
                .addFields(
                    { name: '📁 Channel', value: `${channel}`, inline: true },
                    { name: '🎨 Color', value: colorChoice, inline: true },
                    { name: '🎬 GIF Type', value: gifType === 'custom' ? 'Custom URL' : gifType, inline: true },
                    { name: '🔗 GIF URL', value: `[Click to view](${gifUrl})`, inline: false },
                    { name: '🎭 Auto-Role', value: autoRole ? `${autoRole}` : 'None', inline: true }
                )
                .setImage(gifType === 'custom' ? gifUrl : null)
                .setFooter({ 
                    text: 'Next member will receive this custom welcome!',
                    iconURL: interaction.guild.iconURL()
                });
            
            if (gifType !== 'custom') {
                confirmEmbed.setThumbnail(gifUrl);
            }
            
            await interaction.editReply({ embeds: [confirmEmbed] });
            
            console.log(`✅ Custom welcome setup complete for ${interaction.guild.name}`);
            console.log(`🎬 Custom GIF URL: ${gifUrl}`);
            
        } catch (error) {
            console.error('Custom welcome setup error:', error);
            await interaction.editReply({
                content: `❌ **Error:** ${error.message}\n\n**Troubleshooting:**\n1. Use direct GIF URL ending with .gif\n2. URL must be publicly accessible\n3. Try a different GIF host\n\n**Working example:**\n\`https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif\``,
                ephemeral: true
            });
        }
    },
    
    // Helper: Format message with variables
    formatMessage(template, user, guild) {
        return template
            .replace(/{user}/g, user.toString())
            .replace(/{username}/g, user.username)
            .replace(/{server}/g, guild.name)
            .replace(/{count}/g, guild.memberCount)
            .replace(/{timestamp}/g, Math.floor(Date.now()/1000))
            .replace(/{created}/g, Math.floor(user.createdTimestamp/1000));
    },
    
    // Helper: Validate and fix GIF URL
    validateAndFixGifUrl(url) {
        if (!url) return null;
        
        // Remove query parameters
        url = url.split('?')[0];
        
        // Ensure it ends with .gif
        if (!url.toLowerCase().endsWith('.gif')) {
            // Try to fix Tenor URLs
            if (url.includes('tenor.com/view')) {
                // Extract ID and convert to direct URL
                const match = url.match(/tenor\.com\/view\/([^\-]+)/);
                if (match && match[1]) {
                    return `https://media.tenor.com/${match[1]}.gif`;
                }
            }
            // If still not .gif, add .gif extension
            return url + '.gif';
        }
        
        return url;
    },
    
    // Helper: Validate GIF URL works
    async validateGifUrl(url) {
        try {
            if (!url || typeof url !== 'string') return false;
            
            // Basic validation
            const validExtensions = ['.gif', '.gifv'];
            const hasValidExtension = validExtensions.some(ext => 
                url.toLowerCase().includes(ext)
            );
            
            if (!hasValidExtension) return false;
            
            // Accept common GIF hosts
            const allowedHosts = [
                'tenor.com',
                'giphy.com',
                'i.giphy.com',
                'media.giphy.com',
                'cdn.discordapp.com',
                'media.discordapp.net',
                'i.imgur.com',
                'imgur.com'
            ];
            
            const urlObj = new URL(url);
            const isValidHost = allowedHosts.some(host => 
                urlObj.hostname.includes(host)
            );
            
            return isValidHost;
            
        } catch {
            return false;
        }
    },
    
    getRandomColor() {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Cyan'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};