const { EmbedBuilder } = require('discord.js');

class WelcomeSystem {
    constructor(client) {
        this.client = client;
        this.welcomeConfigs = new Map();
        this.customGifs = new Map(); // Store custom GIFs per guild
    }

    // Setup welcome with custom GIF
    setupWelcome(guildId, channelId, config = {}) {
        const configData = {
            channelId,
            enabled: true,
            message: config.message || "Welcome {user} to **{server}**! 🎉",
            gifUrl: config.gifUrl || this.getDefaultGif(),
            embedColor: config.embedColor || 'Red',
            sendDM: config.sendDM !== false,
            autoRoleId: config.autoRoleId || null,
            isCustomGif: !!config.gifUrl // Flag for custom GIFs
        };

        this.welcomeConfigs.set(guildId, configData);
        
        // Store custom GIF separately
        if (config.gifUrl) {
            this.customGifs.set(guildId, config.gifUrl);
        }
        
        console.log(`✅ Welcome setup for guild ${guildId}`);
        console.log(`🎬 GIF URL: ${config.gifUrl || 'Default'}`);
        
        return configData;
    }

    // Handle member join with custom GIF
    async handleMemberJoin(member) {
        const config = this.welcomeConfigs.get(member.guild.id);
        if (!config || !config.enabled) return;

        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        try {
            // Prepare message
            const message = this.parseWelcomeMessage(config.message, member);
            
            // Get GIF URL (custom or default)
            const gifUrl = config.gifUrl || this.getDefaultGif();
            
            console.log(`🎬 Sending welcome to ${member.user.tag}`);
            console.log(`📸 GIF: ${gifUrl.substring(0, 50)}...`);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(config.embedColor || 'Red')
                .setTitle(`🎉 Welcome to ${member.guild.name}!`)
                .setDescription(message)
                .setImage(gifUrl)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: '👤 User', value: member.user.tag, inline: true },
                    { name: '🆔 ID', value: member.user.id, inline: true },
                    { name: '👥 Member #', value: `#${member.guild.memberCount}`, inline: true }
                )
                .setFooter({ 
                    text: `Custom Welcome • ${member.guild.name}`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            // Try to send with GIF
            try {
                await channel.send({ 
                    content: `${member} **A NEW MEMBER HAS ARRIVED!** 🎊`,
                    embeds: [embed] 
                });
                console.log(`✅ Custom welcome sent successfully!`);
            } catch (sendError) {
                console.error('Failed to send with GIF, trying without:', sendError);
                // Fallback: Send without GIF
                embed.setImage(null);
                await channel.send({ 
                    content: `${member} Welcome! 🎉\n*GIF couldn't load, but welcome anyway!*`,
                    embeds: [embed] 
                });
            }
            
            // Add reactions
            setTimeout(async () => {
                try {
                    const messages = await channel.messages.fetch({ limit: 1 });
                    const lastMessage = messages.first();
                    if (lastMessage && lastMessage.embeds.length > 0) {
                        await lastMessage.react('🎉');
                        await lastMessage.react('👋');
                        await lastMessage.react('❤️');
                    }
                } catch (error) {
                    console.log('Could not add reactions');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Welcome system error:', error);
            // Ultimate fallback
            await channel.send(`${member} Welcome to **${member.guild.name}**! 🎉 (Member #${member.guild.memberCount})`);
        }
        
        // Send DM if enabled
        if (config.sendDM && !member.user.bot) {
            this.sendWelcomeDM(member, config);
        }
    }

    // Parse message with variables
    parseWelcomeMessage(template, member) {
        return template
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount)
            .replace(/{timestamp}/g, Math.floor(Date.now()/1000))
            .replace(/{created}/g, Math.floor(member.user.createdTimestamp/1000));
    }

    // Send welcome DM
    async sendWelcomeDM(member, config) {
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(config.embedColor || 'Blue')
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(`Thanks for joining **${member.guild.name}**! 🎉\n\nWe're happy to have you!`)
                .setThumbnail(member.guild.iconURL())
                .addFields(
                    { name: '📝 Tips', value: '• Check the rules channel\n• Introduce yourself\n• Have fun!' }
                )
                .setFooter({ text: 'Enjoy your stay! ❤️' });
            
            await member.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            console.log(`Could not DM ${member.user.tag}`);
        }
    }

    // Get default GIF
    getDefaultGif() {
        const defaultGifs = [
            'https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
            'https://i.giphy.com/media/26tknCqiJrBQG6DrC/giphy.gif',
            'https://i.giphy.com/media/l0HU7JI1uHRQmQqk0/giphy.gif',
            'https://i.giphy.com/media/xT8qBhrlNooHBYR9f6/giphy.gif'
        ];
        return defaultGifs[Math.floor(Math.random() * defaultGifs.length)];
    }

    // Update custom GIF for guild
    updateCustomGif(guildId, gifUrl) {
        this.customGifs.set(guildId, gifUrl);
        const config = this.welcomeConfigs.get(guildId);
        if (config) {
            config.gifUrl = gifUrl;
            config.isCustomGif = true;
        }
        return true;
    }

    // Get current configuration
    getConfig(guildId) {
        return this.welcomeConfigs.get(guildId);
    }
}

module.exports = WelcomeSystem;