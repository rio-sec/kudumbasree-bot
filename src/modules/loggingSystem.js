const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

class LoggingSystem {
    constructor(client) {
        this.client = client;
        this.logChannels = new Map();
        this.eventColors = {
            VOICE_JOIN: 0x3498db,      // Blue
            VOICE_LEAVE: 0x3498db,
            VOICE_MOVE: 0x3498db,
            MESSAGE_DELETE: 0xe74c3c,  // Red
            MESSAGE_EDIT: 0xe67e22,    // Orange
            MEMBER_JOIN: 0x2ecc71,     // Green
            MEMBER_LEAVE: 0xe74c3c,
            ROLE_ADD: 0x9b59b6,        // Purple
            ROLE_REMOVE: 0x9b59b6,
            BAN: 0xc0392b,             // Dark red
            KICK: 0xc0392b,
            CHANNEL_CREATE: 0x1abc9c,  // Teal
            CHANNEL_DELETE: 0xc0392b
        };
    }

    // Initialize logging for a guild
    async initializeGuild(guild) {
        // Find existing log channels
        const logCategory = guild.channels.cache.find(
            c => c.type === 4 && c.name.includes('KUDUMNBASREE LOGS')
        );

        if (logCategory) {
            const logChannels = {};
            
            // Map log channels by type
            logCategory.children.cache.forEach(channel => {
                if (channel.name.includes('voice-logs')) logChannels.VOICE = channel;
                if (channel.name.includes('message-logs')) logChannels.MESSAGE = channel;
                if (channel.name.includes('member-logs')) logChannels.MEMBER = channel;
                if (channel.name.includes('vc-status-logs')) logChannels.STATUS = channel;
                if (channel.name.includes('moderation-logs')) logChannels.MODERATION = channel;
            });

            this.logChannels.set(guild.id, logChannels);
            return true;
        }
        
        return false;
    }

    // Create log embed
    createLogEmbed(eventType, data) {
        const color = this.eventColors[eventType] || 0x95a5a6;
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`[${eventType.replace(/_/g, ' ')}]`)
            .setTimestamp();

        // Add fields based on event type
        switch(eventType) {
            case 'VOICE_JOIN':
            case 'VOICE_LEAVE':
            case 'VOICE_MOVE':
                embed.setDescription(`${data.user.tag} ${eventType === 'VOICE_JOIN' ? 'joined' : eventType === 'VOICE_LEAVE' ? 'left' : 'moved'} voice channel`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📁 Channel', value: `<#${data.channel.id}>`, inline: true },
                         { name: '🕒 Time', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
                     );
                break;

            case 'MESSAGE_DELETE':
                embed.setDescription('Message deleted')
                     .addFields(
                         { name: '👤 Author', value: `<@${data.author.id}>`, inline: true },
                         { name: '📁 Channel', value: `<#${data.channel.id}>`, inline: true },
                         { name: '🗑️ Content', value: data.content?.slice(0, 1000) || '*Content unavailable*', inline: false }
                     );
                break;

            case 'MEMBER_JOIN':
                embed.setDescription(`${data.user.tag} joined the server`)
                     .setThumbnail(data.user.displayAvatarURL())
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '🆔 ID', value: data.user.id, inline: true },
                         { name: '📅 Account Created', value: `<t:${Math.floor(data.user.createdTimestamp/1000)}:R>`, inline: true },
                         { name: '👥 Member Count', value: data.guild.memberCount.toString(), inline: true }
                     );
                break;

            case 'MEMBER_LEAVE':
                embed.setDescription(`${data.user?.tag || 'Unknown user'} left the server`)
                     .addFields(
                         { name: '👤 User', value: data.user ? `<@${data.user.id}>` : 'Unknown', inline: true },
                         { name: '👥 Member Count', value: data.guild.memberCount.toString(), inline: true }
                     );
                break;

            case 'ROLE_ADD':
            case 'ROLE_REMOVE':
                embed.setDescription(`${eventType === 'ROLE_ADD' ? 'Role added to' : 'Role removed from'} ${data.member.user.tag}`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.member.id}>`, inline: true },
                         { name: '🎭 Role', value: `<@&${data.role.id}>`, inline: true },
                         { name: '👤 By', value: data.executor ? `<@${data.executor.id}>` : 'System', inline: true }
                     );
                break;
        }

        embed.setFooter({ 
            text: `Kudumbasree Logs • Dev: ${this.client.config.developer}`,
            iconURL: this.client.user.displayAvatarURL()
        });

        return embed;
    }

    // Log an event
    async log(eventType, data) {
        const guild = data.guild || data.member?.guild;
        if (!guild) return;

        // Initialize if not already
        if (!this.logChannels.has(guild.id)) {
            await this.initializeGuild(guild);
        }

        const channels = this.logChannels.get(guild.id);
        if (!channels) return;

        const embed = this.createLogEmbed(eventType, data);

        // Send to appropriate channel
        let targetChannel;
        switch(eventType) {
            case 'VOICE_JOIN':
            case 'VOICE_LEAVE':
            case 'VOICE_MOVE':
                targetChannel = channels.VOICE;
                break;
            case 'MESSAGE_DELETE':
            case 'MESSAGE_EDIT':
                targetChannel = channels.MESSAGE;
                break;
            case 'MEMBER_JOIN':
            case 'MEMBER_LEAVE':
                targetChannel = channels.MEMBER;
                break;
            case 'ROLE_ADD':
            case 'ROLE_REMOVE':
            case 'BAN':
            case 'KICK':
                targetChannel = channels.MODERATION;
                break;
            default:
                targetChannel = channels.MEMBER;
        }

        if (targetChannel) {
            try {
                await targetChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to send log:', error);
            }
        }
    }

    // Create all log channels automatically
    async createAllLogChannels(guild) {
        const logChannels = [
            { 
                name: '🔊-voice-logs', 
                type: 'VOICE_ACTIVITY',
                color: '#3498db',
                description: 'Voice join/leave/move events'
            },
            { 
                name: '📝-message-logs', 
                type: 'MESSAGE_ACTIVITY',
                color: '#2ecc71',
                description: 'Message delete/edit events'
            },
            { 
                name: '👥-member-logs', 
                type: 'MEMBER_ACTIVITY',
                color: '#9b59b6',
                description: 'Member join/leave/update events'
            },
            { 
                name: '🎤-vc-status-logs', 
                type: 'VOICE_STATUS',
                color: '#f39c12',
                description: 'Voice mute/deafen events'
            },
            { 
                name: '⚙️-moderation-logs', 
                type: 'MODERATION_ACTIONS',
                color: '#e74c3c',
                description: 'Role/kick/ban/timeout events'
            }
        ];

        // Create category
        const category = await guild.channels.create({
            name: '📊 KUDUMNBASREE LOGS',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                }
            ]
        });

        const createdChannels = {};

        // Create each log channel
        for (const log of logChannels) {
            const channel = await guild.channels.create({
                name: log.name,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: `📊 ${log.description}`,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    }
                ]
            });

            createdChannels[log.type] = channel;
        }

        this.logChannels.set(guild.id, createdChannels);
        return createdChannels;
    }

    // Setup automatic event listeners
    setupListeners() {
        const client = this.client;

        // Voice State Updates
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (!oldState.channelId && newState.channelId) {
                // User joined voice
                this.log('VOICE_JOIN', {
                    user: newState.member.user,
                    channel: newState.channel,
                    guild: newState.guild
                });
            } else if (oldState.channelId && !newState.channelId) {
                // User left voice
                this.log('VOICE_LEAVE', {
                    user: oldState.member.user,
                    channel: oldState.channel,
                    guild: oldState.guild
                });
            } else if (oldState.channelId !== newState.channelId) {
                // User moved voice channels
                this.log('VOICE_MOVE', {
                    user: newState.member.user,
                    channel: newState.channel,
                    oldChannel: oldState.channel,
                    guild: newState.guild
                });
            }
        });

        // Message Delete
        client.on('messageDelete', (message) => {
            if (message.author?.bot) return;
            
            this.log('MESSAGE_DELETE', {
                author: message.author,
                content: message.content,
                channel: message.channel,
                guild: message.guild
            });
        });

        // Guild Member Add
        client.on('guildMemberAdd', (member) => {
            this.log('MEMBER_JOIN', {
                user: member.user,
                guild: member.guild
            });
        });

        // Guild Member Remove
        client.on('guildMemberRemove', (member) => {
            this.log('MEMBER_LEAVE', {
                user: member.user,
                guild: member.guild
            });
        });
    }
}

module.exports = LoggingSystem;