const { EmbedBuilder } = require('discord.js');

class WelcomeSystem {
    constructor(client) {
        this.client = client;
        this.welcomeConfigs = new Map();
        
        // Use direct GIF URLs, not Tenor links
        this.defaultWelcomeGif = 'https://media.tenor.com/ISx2jQ5l8eAAAAAC/welcome.gif'; // Direct GIF
        this.defaultBoosterGif = 'https://media.tenor.com/YpJ2F4YVhU0AAAAC/celebration.gif'; // Direct GIF
        
        // Alternative GIF URLs
        this.alternativeGifs = {
            welcome: [
                'https://media.tenor.com/ISx2jQ5l8eAAAAAC/welcome.gif',
                'https://media.tenor.com/0AVbKGY_MxMAAAAM/welcome.gif',
                'https://media.tenor.com/t3P7OVB_kUEAAAAM/anime-welcome.gif',
                'https://media.giphy.com/media/26tknCqiJrBQG6DrC/giphy.gif',
                'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'
            ],
            booster: [
                'https://media.tenor.com/YpJ2F4YVhU0AAAAC/celebration.gif',
                'https://media.tenor.com/QJvwqT7aBkYAAAAM/woohoo-celebrate.gif',
                'https://media.giphy.com/media/26tknCqiJrBQG6DrC/giphy.gif',
                'https://media.giphy.com/media/l0HU7JI1uHRQmQqk0/giphy.gif'
            ]
        };
    }

    // Convert Tenor URL to direct GIF URL
    convertTenorUrl(tenorUrl) {
        // If it's already a direct GIF URL, return as is
        if (tenorUrl.includes('.gif') && !tenorUrl.includes('tenor.com/view')) {
            return tenorUrl;
        }
        
        // Try to extract from Tenor share URL
        if (tenorUrl.includes('tenor.com/view')) {
            // This is a view page, not direct GIF
            // Return a default GIF instead
            return this.defaultWelcomeGif;
        }
        
        // If it's a Tenor GIF ID
        if (tenorUrl.includes('tenor.com')) {
            // Extract GIF ID and construct direct URL
            const match = tenorUrl.match(/tenor\.com\/view\/([^\-]+)/);
            if (match && match[1]) {
                return `https://media.tenor.com/${match[1]}.gif`;
            }
        }
        
        // Default fallback
        return tenorUrl;
    }

    // Setup welcome system for a guild
    async setupWelcome(guildId, channelId, config = {}) {
        const configData = {
            channelId,
            enabled: true,
            message: config.message || "Welcome {user} to **{server}**! 🎉 You're member #{count}",
            gifUrl: config.gifUrl || this.defaultWelcomeGif,
            embedColor: config.embedColor || '#FF6B6B',
            sendDM: config.sendDM !== false,
            dmMessage: config.dmMessage || "Welcome to **{server}**! Check out the rules and have fun!",
            autoRoleId: config.autoRoleId || null
        };

        this.welcomeConfigs.set(guildId, configData);
        return configData;
    }

    // Setup booster logs
    async setupBoosterLogs(guildId, channelId, config = {}) {
        const boosterConfig = {
            channelId,
            enabled: true,
            gifUrl: config.gifUrl || this.defaultBoosterGif,
            embedColor: config.embedColor || '#9b59b6',
            message: config.message || "{user} just boosted **{server}**! 🚀\n**Level:** {boostLevel}\n**Total Boosts:** {totalBoosts}",
            pingRole: config.pingRole || null
        };

        this.boosterConfigs = this.boosterConfigs || new Map();
        this.boosterConfigs.set(guildId, boosterConfig);
        return boosterConfig;
    }

    // Handle member join
    async handleMemberJoin(member) {
        const config = this.welcomeConfigs.get(member.guild.id);
        if (!config || !config.enabled) return;

        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        // Convert GIF URL if needed
        const safeGifUrl = this.convertTenorUrl(config.gifUrl || this.defaultWelcomeGif);
        
        // Parse message
        const message = this.parseWelcomeMessage(config.message, member);
        
        try {
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(config.embedColor || '#FF6B6B')
                .setTitle(`🎉 Welcome to ${member.guild.name}!`)
                .setDescription(message)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setImage(safeGifUrl)
                .addFields(
                    { name: '👤 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`, inline: true },
                    { name: '📅 Joined', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true },
                    { name: '👥 Member Count', value: `#${member.guild.memberCount}`, inline: true }
                )
                .setFooter({ 
                    text: `Kudumbasree Welcome System • ${member.guild.name}`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            // Send welcome message
            await channel.send({ 
                content: `${member}`,
                embeds: [embed] 
            });

        } catch (error) {
            console.error('Welcome message error:', error);
            // Fallback: Send simple welcome
            await channel.send(`${member} Welcome to **${member.guild.name}**! 🎉 You're member #${member.guild.memberCount}`);
        }

        // Send DM if enabled
        if (config.sendDM && !member.user.bot) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription(this.parseWelcomeMessage(config.dmMessage, member))
                    .setThumbnail(member.guild.iconURL())
                    .addFields(
                        { name: '📝 Server Rules', value: 'Please read the rules channel!', inline: false },
                        { name: '🎭 Get Roles', value: 'Check out the roles channel', inline: false },
                        { name: '🎮 Have Fun!', value: 'Enjoy your stay!', inline: false }
                    )
                    .setFooter({ text: 'Thank you for joining us!' })
                    .setTimestamp();

                await member.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Could not DM ${member.user.tag}: ${error.message}`);
            }
        }

        // Assign auto-role if configured
        if (config.autoRoleId) {
            try {
                const role = member.guild.roles.cache.get(config.autoRoleId);
                if (role) {
                    setTimeout(async () => {
                        await member.roles.add(role);
                    }, 3000); // 3 second delay
                }
            } catch (error) {
                console.error('Failed to assign auto-role:', error);
            }
        }
    }

    // Handle booster update
    async handleGuildMemberUpdate(oldMember, newMember) {
        // Check for new boost
        if (!oldMember.premiumSince && newMember.premiumSince) {
            await this.handleNewBoost(newMember);
        }
        // Check for boost removal
        else if (oldMember.premiumSince && !newMember.premiumSince) {
            await this.handleBoostRemoved(newMember);
        }
    }

    // Handle new boost
    async handleNewBoost(member) {
        const config = this.boosterConfigs?.get(member.guild.id);
        if (!config || !config.enabled) return;

        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        // Convert GIF URL if needed
        const safeGifUrl = this.convertTenorUrl(config.gifUrl || this.defaultBoosterGif);
        
        const boostLevel = member.premiumSince ? '2' : '1';
        const totalBoosts = member.guild.premiumSubscriptionCount || 0;

        // Parse message
        const message = config.message
            .replace(/{user}/g, member.toString())
            .replace(/{server}/g, member.guild.name)
            .replace(/{boostLevel}/g, boostLevel)
            .replace(/{totalBoosts}/g, totalBoosts);

        try {
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(config.embedColor || '#9b59b6')
                .setTitle('🚀 NEW SERVER BOOSTER!')
                .setDescription(message)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setImage(safeGifUrl)
                .addFields(
                    { name: '👤 Booster', value: `${member}`, inline: true },
                    { name: '⭐ Boost Level', value: `Tier ${boostLevel}`, inline: true },
                    { name: '📈 Total Boosts', value: totalBoosts.toString(), inline: true },
                    { name: '🎁 Benefits', value: 'Special roles & perks unlocked!', inline: false }
                )
                .setFooter({ 
                    text: `${member.guild.name} Booster System`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();

            const content = config.pingRole ? `<@&${config.pingRole}>` : '';
            
            await channel.send({ 
                content: content,
                embeds: [embed] 
            });

        } catch (error) {
            console.error('Booster message error:', error);
            // Fallback: Simple message
            await channel.send(`🎉 ${member} just boosted the server! Thank you! 🚀`);
        }
    }

    // Handle boost removed
    async handleBoostRemoved(member) {
        const config = this.boosterConfigs?.get(member.guild.id);
        if (!config || !config.enabled) return;

        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('💔 Boost Removed')
            .setDescription(`${member} is no longer boosting the server.\nThank you for your support!`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: 'We appreciate your past support!' })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    // Parse welcome message with variables
    parseWelcomeMessage(template, member) {
        return template
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount)
            .replace(/{mention}/g, member.toString());
    }

    // Get random booster GIF
    getRandomBoosterGif() {
        return this.boosterGifs[Math.floor(Math.random() * this.boosterGifs.length)];
    }

    // Update configuration
    updateConfig(guildId, type, updates) {
        if (type === 'welcome') {
            const config = this.welcomeConfigs.get(guildId) || {};
            this.welcomeConfigs.set(guildId, { ...config, ...updates });
        } else if (type === 'booster') {
            const config = this.boosterConfigs.get(guildId) || {};
            this.boosterConfigs.set(guildId, { ...config, ...updates });
        }
    }

    // Get configuration
    getConfig(guildId, type) {
        if (type === 'welcome') return this.welcomeConfigs.get(guildId);
        if (type === 'booster') return this.boosterConfigs?.get(guildId);
        return null;
    }
}

module.exports = WelcomeSystem;