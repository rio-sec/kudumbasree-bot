const { EmbedBuilder, ChannelType, PermissionFlagsBits, AuditLogEvent } = require('discord.js');

class LoggingSystem {
    constructor(client) {
        this.client = client;
        this.logChannels = new Map();
        this.eventColors = {
            // Voice Activity
            VOICE_JOIN: 0x3498db,     // Blue
            VOICE_LEAVE: 0x3498db,
            VOICE_MOVE: 0x3498db,
            VOICE_SWITCH: 0x2980b9,
            
            // Message Activity  
            MESSAGE_DELETE: 0xe74c3c, // Red
            MESSAGE_EDIT: 0xe67e22,   // Orange
            BULK_DELETE: 0xc0392b,    // Dark Red
            
            // Member Activity
            MEMBER_JOIN: 0x2ecc71,    // Green
            MEMBER_LEAVE: 0xe74c3c,
            MEMBER_UPDATE: 0x9b59b6,  // Purple
            NICKNAME_CHANGE: 0x9b59b6,
            
            // Voice Status
            VOICE_MUTE: 0xf39c12,     // Orange/Yellow
            VOICE_DEAFEN: 0xf39c12,
            SERVER_MUTE: 0xf39c12,
            SERVER_DEAFEN: 0xf39c12,
            
            // Moderation Actions
            ROLE_ADD: 0x9b59b6,       // Purple
            ROLE_REMOVE: 0x9b59b6,
            TIMEOUT: 0xe74c3c,        // Red
            BAN: 0xc0392b,            // Dark Red
            KICK: 0xe74c3c,
            
            // Channel Events
            CHANNEL_CREATE: 0x1abc9c, // Teal
            CHANNEL_DELETE: 0xc0392b,
            CHANNEL_UPDATE: 0x3498db,
            
            // Server Events
            SERVER_UPDATE: 0x9b59b6,
            EMOJI_UPDATE: 0xf1c40f,   // Yellow
            STICKER_UPDATE: 0xf1c40f,
            
            // Boost Events
            BOOST_START: 0xff73fa,    // Pink
            BOOST_END: 0xff73fa
        };
        
        this.eventEmojis = {
            VOICE_JOIN: '🔊',
            VOICE_LEAVE: '🔇',
            VOICE_MOVE: '↔️',
            MESSAGE_DELETE: '🗑️',
            MESSAGE_EDIT: '✏️',
            MEMBER_JOIN: '👋',
            MEMBER_LEAVE: '🚪',
            MEMBER_UPDATE: '👤',
            BAN: '🔨',
            KICK: '👢',
            TIMEOUT: '⏰',
            ROLE_ADD: '➕',
            ROLE_REMOVE: '➖',
            CHANNEL_CREATE: '📁',
            CHANNEL_DELETE: '🗑️',
            BOOST_START: '🚀',
            BOOST_END: '💔'
        };
    }

    // Initialize logging for a guild
    async initializeGuild(guild) {
        // Find existing log category
        const logCategory = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && 
                 (c.name.includes('KUDUMNBASREE LOGS') || c.name.includes('📊'))
        );

        if (logCategory) {
            const logChannels = {};
            
            // Map existing channels
            logCategory.children.cache.forEach(channel => {
                if (channel.name.includes('🔊') || channel.name.includes('voice')) {
                    logChannels.VOICE = channel;
                }
                if (channel.name.includes('📝') || channel.name.includes('message')) {
                    logChannels.MESSAGE = channel;
                }
                if (channel.name.includes('👥') || channel.name.includes('member')) {
                    logChannels.MEMBER = channel;
                }
                if (channel.name.includes('🎤') || channel.name.includes('vc-status')) {
                    logChannels.STATUS = channel;
                }
                if (channel.name.includes('⚙️') || channel.name.includes('moderation')) {
                    logChannels.MODERATION = channel;
                }
            });

            this.logChannels.set(guild.id, logChannels);
            console.log(`✅ Found existing logs for ${guild.name}`);
            return logChannels;
        }
        
        return null;
    }

    // Create all log channels automatically
    async createAllLogChannels(guild, modRole = null) {
        try {
            // Create category
            const category = await guild.channels.create({
                name: '📊 KUDUMNBASREE LOGS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: this.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]
            });

            // Define log channels
            const logDefinitions = [
                { 
                    name: '🔊-voice-logs', 
                    type: 'VOICE',
                    description: 'Voice join/leave/move events',
                    color: '#3498db'
                },
                { 
                    name: '📝-message-logs', 
                    type: 'MESSAGE',
                    description: 'Message delete/edit events',
                    color: '#2ecc71'
                },
                { 
                    name: '👥-member-logs', 
                    type: 'MEMBER',
                    description: 'Member join/leave/update events',
                    color: '#9b59b6'
                },
                { 
                    name: '🎤-vc-status-logs', 
                    type: 'STATUS',
                    description: 'Voice mute/deafen events',
                    color: '#f39c12'
                },
                { 
                    name: '⚙️-moderation-logs', 
                    type: 'MODERATION',
                    description: 'Role/kick/ban/timeout events',
                    color: '#e74c3c'
                }
            ];

            const createdChannels = {};

            // Create each channel
            for (const log of logDefinitions) {
                const permissionOverwrites = [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: this.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
                    }
                ];

                // Add mod role permissions if provided
                if (modRole) {
                    permissionOverwrites.push({
                        id: modRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                    });
                }

                const channel = await guild.channels.create({
                    name: log.name,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    topic: `📊 ${log.description} • Auto-logging enabled`,
                    permissionOverwrites: permissionOverwrites,
                    reason: 'Kudumbasree Premium Logging System'
                });

                createdChannels[log.type] = channel;
                
                // Send welcome message to log channel
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(log.color)
                    .setTitle(`📊 ${log.name.replace('-', ' ')}`)
                    .setDescription(`**Premium Logging Activated**\n\n${log.description}\n\n*Automatically logging all ${log.type.toLowerCase()} events*`)
                    .setFooter({ text: 'Kudumbasree Premium Logging System' })
                    .setTimestamp();
                
                await channel.send({ embeds: [welcomeEmbed] });
            }

            this.logChannels.set(guild.id, createdChannels);
            
            // Store configuration
            const configEmbed = new EmbedBuilder()
                .setColor(0x9b59b6)
                .setTitle('✅ Premium Logging System Setup Complete')
                .setDescription('All 5 log channels created successfully')
                .addFields(
                    { name: '📁 Category', value: category.name, inline: true },
                    { name: '📊 Total Channels', value: '5', inline: true },
                    { name: '🛡️ Mod Access', value: modRole ? modRole.name : 'Admins only', inline: true }
                )
                .setFooter({ text: 'Auto-logging activated for all events' });
            
            // Send to first log channel
            if (createdChannels.VOICE) {
                await createdChannels.VOICE.send({ embeds: [configEmbed] });
            }
            
            console.log(`✅ Created 5 log channels for ${guild.name}`);
            return createdChannels;
            
        } catch (error) {
            console.error('Failed to create log channels:', error);
            throw error;
        }
    }

    // Setup event listeners
    setupListeners() {
        // Check if listeners already setup
        if (this.listenersSetup) {
            console.log('⚠️ Listeners already setup, skipping...');
            return;
        }

        console.log('✅ Setting up logging listeners...');
        const client = this.client;

        // ========== VOICE EVENTS ==========
        // Route voice updates to a single handler to avoid duplicate logging
        client.on('voiceStateUpdate', (oldState, newState) => {
            this.handleVoiceStateUpdate(oldState, newState);
        });

        // ========== MESSAGE EVENTS ==========
        client.on('messageDelete', async (message) => {
            if (message.author?.bot) return;
            
            await this.log('MESSAGE_DELETE', {
                author: message.author,
                content: message.content,
                channel: message.channel,
                guild: message.guild,
                messageId: message.id
            });
        });

        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.author?.bot || oldMessage.content === newMessage.content) return;
            
            await this.log('MESSAGE_EDIT', {
                author: newMessage.author,
                oldContent: oldMessage.content,
                newContent: newMessage.content,
                channel: newMessage.channel,
                guild: newMessage.guild,
                messageId: newMessage.id,
                jumpUrl: newMessage.url
            });
        });

        // ========== MEMBER EVENTS ==========
        client.on('guildMemberAdd', async (member) => {
            await this.log('MEMBER_JOIN', {
                user: member.user,
                guild: member.guild,
                accountAge: Date.now() - member.user.createdTimestamp
            });
        });

        client.on('guildMemberRemove', async (member) => {
            await this.log('MEMBER_LEAVE', {
                user: member.user,
                guild: member.guild
            });
        });

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            // Nickname change
            if (oldMember.nickname !== newMember.nickname) {
                await this.log('NICKNAME_CHANGE', {
                    user: newMember.user,
                    guild: newMember.guild,
                    oldNickname: oldMember.nickname,
                    newNickname: newMember.nickname
                });
            }
            
            // Role changes (basic detection)
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
                const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
                
                if (addedRoles.size > 0) {
                    await this.log('ROLE_ADD', {
                        user: newMember.user,
                        guild: newMember.guild,
                        roles: Array.from(addedRoles.values()).map(r => r.name)
                    });
                }
                
                if (removedRoles.size > 0) {
                    await this.log('ROLE_REMOVE', {
                        user: newMember.user,
                        guild: newMember.guild,
                        roles: Array.from(removedRoles.values()).map(r => r.name)
                    });
                }
            }
        });

        // ========== GUILD EVENTS ==========
        client.on('guildBanAdd', async (ban) => {
            await this.log('BAN', {
                user: ban.user,
                guild: ban.guild,
                reason: ban.reason || 'No reason provided'
            });
        });

        client.on('guildBanRemove', async (ban) => {
            await this.log('UNBAN', {
                user: ban.user,
                guild: ban.guild
            });
        });

        this.listenersSetup = true;
        console.log('✅ Logging system listeners activated');
    }

    // Handle voice state updates with de-duplication and only meaningful events
    handleVoiceStateUpdate(oldState, newState) {
        // Only log if there's an actual change
        if (!oldState.channelId && newState.channelId) {
            // User joined voice
            this.log('VOICE_JOIN', {
                user: newState.member.user,
                channel: newState.channel,
                guild: newState.guild
            });
            return;
        }

        if (oldState.channelId && !newState.channelId) {
            // User left voice
            this.log('VOICE_LEAVE', {
                user: oldState.member.user,
                channel: oldState.channel,
                guild: oldState.guild
            });
            return;
        }

        if (oldState.channelId !== newState.channelId) {
            // User moved voice channels
            this.log('VOICE_MOVE', {
                user: newState.member.user,
                channel: newState.channel,
                oldChannel: oldState.channel,
                guild: newState.guild
            });
        }

        // Intentionally skip mute/deafen/server mute/deafen logging to reduce spam
    }

    // Create log embed
    createLogEmbed(eventType, data) {
        const color = this.eventColors[eventType] || 0x95a5a6;
        const emoji = this.eventEmojis[eventType] || '📝';
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${this.formatEventName(eventType)}`)
            .setTimestamp();

        // Add event-specific fields
        switch(eventType) {
            case 'VOICE_JOIN':
                embed.setDescription(`**Joined Voice Channel**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📁 Channel', value: `<#${data.channel.id}>`, inline: true },
                         { name: '🕒 Time', value: `<t:${Math.floor(Date.now()/1000)}:T>`, inline: true }
                     );
                break;

            case 'VOICE_LEAVE':
                embed.setDescription(`**Left Voice Channel**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📁 Channel', value: data.channel ? `<#${data.channel.id}>` : 'Unknown', inline: true }
                     );
                break;

            case 'VOICE_MOVE':
                embed.setDescription(`**Moved Voice Channels**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📤 From', value: data.oldChannel ? `<#${data.oldChannel.id}>` : 'Unknown', inline: true },
                         { name: '📥 To', value: `<#${data.channel.id}>`, inline: true }
                     );
                break;

            case 'MESSAGE_DELETE':
                embed.setDescription(`**Message Deleted**`)
                     .addFields(
                         { name: '👤 Author', value: `<@${data.author.id}>`, inline: true },
                         { name: '📁 Channel', value: `<#${data.channel.id}>`, inline: true },
                         { name: '🗑️ Content', value: data.content ? `\`\`\`${data.content.substring(0, 1000)}\`\`\`` : '*Content unavailable*', inline: false }
                     );
                break;

            case 'MESSAGE_EDIT':
                embed.setDescription(`**Message Edited** [Jump to Message](${data.jumpUrl})`)
                     .addFields(
                         { name: '👤 Author', value: `<@${data.author.id}>`, inline: true },
                         { name: '📁 Channel', value: `<#${data.channel.id}>`, inline: true },
                         { name: '📝 Before', value: data.oldContent ? `\`\`\`${data.oldContent.substring(0, 500)}\`\`\`` : '*No content*', inline: false },
                         { name: '📝 After', value: data.newContent ? `\`\`\`${data.newContent.substring(0, 500)}\`\`\`` : '*No content*', inline: false }
                     );
                break;

            case 'MEMBER_JOIN':
                embed.setDescription(`**Member Joined**`)
                     .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '🆔 ID', value: data.user.id, inline: true },
                         { name: '📅 Account Created', value: `<t:${Math.floor(data.user.createdTimestamp/1000)}:R>`, inline: true },
                         { name: '👥 Member Count', value: data.guild.memberCount.toString(), inline: true }
                     );
                break;

            case 'MEMBER_LEAVE':
                embed.setDescription(`**Member Left**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '👥 Member Count', value: data.guild.memberCount.toString(), inline: true }
                     );
                break;

            case 'BAN':
                embed.setDescription(`**Member Banned**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📝 Reason', value: data.reason || 'No reason provided', inline: false }
                     );
                break;

            case 'ROLE_ADD':
                embed.setDescription(`**Roles Added**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '🎭 Roles', value: data.roles.map(r => `\`${r}\``).join(', '), inline: false }
                     );
                break;

            case 'ROLE_REMOVE':
                embed.setDescription(`**Roles Removed**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '🎭 Roles', value: data.roles.map(r => `\`${r}\``).join(', '), inline: false }
                     );
                break;

            case 'VOICE_MUTE':
            case 'VOICE_UNMUTE':
                embed.setDescription(`**${eventType === 'VOICE_MUTE' ? 'Self Muted' : 'Self Unmuted'}**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📁 Channel', value: data.channel ? `<#${data.channel.id}>` : 'Unknown', inline: true }
                     );
                break;

            case 'SERVER_MUTE':
            case 'SERVER_UNMUTE':
                embed.setDescription(`**${eventType === 'SERVER_MUTE' ? 'Server Muted' : 'Server Unmuted'}**`)
                     .addFields(
                         { name: '👤 User', value: `<@${data.user.id}>`, inline: true },
                         { name: '📁 Channel', value: data.channel ? `<#${data.channel.id}>` : 'Unknown', inline: true }
                     );
                break;
        }

        // Add footer with event ID
        const eventId = Math.random().toString(36).substring(2, 8).toUpperCase();
        embed.setFooter({ 
            text: `Kudumbasree Premium Logs • Event ID: ${eventId} • Dev: ***RIO-SEC***`,
            iconURL: this.client.user?.displayAvatarURL()
        });

        return embed;
    }

    // Log an event
    async log(eventType, data) {
        if (!data.guild) return;

        const guildId = data.guild.id;
        
        // Initialize if not already
        if (!this.logChannels.has(guildId)) {
            await this.initializeGuild(data.guild);
        }

        const channels = this.logChannels.get(guildId);
        if (!channels) return;

        const embed = this.createLogEmbed(eventType, data);

        // Determine target channel
        let targetChannel;
        if (eventType.startsWith('VOICE_') || eventType.startsWith('SERVER_')) {
            targetChannel = channels.VOICE || channels.STATUS || channels.MEMBER;
        } else if (eventType.startsWith('MESSAGE_')) {
            targetChannel = channels.MESSAGE;
        } else if (eventType.startsWith('MEMBER_')) {
            targetChannel = channels.MEMBER;
        } else if (eventType.includes('BAN') || eventType.includes('KICK') || eventType.includes('ROLE') || eventType.includes('TIMEOUT')) {
            targetChannel = channels.MODERATION;
        } else {
            targetChannel = channels.MEMBER;
        }

        if (targetChannel) {
            try {
                await targetChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Failed to send log to ${targetChannel.name}:`, error.message);
            }
        }
    }

    // Format event name
    formatEventName(eventType) {
        return eventType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // Get log statistics
    getLogStats(guildId) {
        const channels = this.logChannels.get(guildId);
        if (!channels) return null;
        
        const stats = {
            totalChannels: Object.keys(channels).length,
            channels: {}
        };
        
        Object.entries(channels).forEach(([type, channel]) => {
            stats.channels[type] = {
                name: channel.name,
                id: channel.id,
                created: channel.createdAt
            };
        });
        
        return stats;
    }
}

module.exports = LoggingSystem;