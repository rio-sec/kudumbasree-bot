const { 
    ChannelType, 
    PermissionOverwrites, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

class DnDSystem {
    constructor(client) {
        this.client = client;
        this.activeRooms = new Map();
        this.roomSettings = new Map();
        this.setupCooldowns = new Set();
    }

    // Create DnD control panel
    async createControlPanel(interaction) {
        const embed = {
            color: 0x45B7D1,
            title: '🎮 DnD Voice Control Panel',
            description: 'Create and manage private voice rooms for focused sessions',
            fields: [
                { name: '🟢 JOIN DND', value: 'Create a private voice room', inline: true },
                { name: '🔧 MY ROOM', value: 'Configure your room settings', inline: true },
                { name: '🚪 LEAVE', value: 'Delete your private room', inline: true },
                { name: '📨 INVITE', value: 'Invite users to your room', inline: true },
                { name: '👥 VISIT', value: 'Browse available rooms', inline: true },
                { name: '📊 STATS', value: 'View room statistics', inline: true }
            ],
            footer: { 
                text: `Kudumbasree Manager • Dev: ${this.client.config.developer}`,
                iconURL: interaction.guild.iconURL()
            },
            timestamp: new Date()
        };

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dnd_join')
                    .setLabel('JOIN DND')
                    .setEmoji('🟢')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dnd_settings')
                    .setLabel('MY ROOM')
                    .setEmoji('🔧')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('dnd_leave')
                    .setLabel('LEAVE')
                    .setEmoji('🚪')
                    .setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dnd_invite')
                    .setLabel('INVITE')
                    .setEmoji('📨')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dnd_visit')
                    .setLabel('VISIT')
                    .setEmoji('👥')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('dnd_stats')
                    .setLabel('STATS')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Success)
            );

        return { embeds: [embed], components: [row1, row2] };
    }

    // Create private voice room
    async createPrivateRoom(interaction) {
        const member = interaction.member;
        const guild = interaction.guild;
        
        // Check cooldown
        if (this.setupCooldowns.has(member.id)) {
            return { error: 'Please wait 30 seconds before creating another room.' };
        }
        
        // Check if user already has a room
        if (this.activeRooms.has(member.id)) {
            const roomId = this.activeRooms.get(member.id);
            const room = guild.channels.cache.get(roomId);
            if (room) {
                return { error: `You already have a room: ${room}` };
            }
        }

        // Find or create DnD category
        let category = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && 
                 c.name.includes('DND') && 
                 c.name.includes('PRIVATE')
        );

        if (!category) {
            category = await guild.channels.create({
                name: '🔒 DND PRIVATE ROOMS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['ViewChannel', 'Connect']
                    }
                ]
            });
        }

        // Create private voice channel
        const voiceChannel = await guild.channels.create({
            name: `🔒 ${member.user.username}'s Room`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            userLimit: 5,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel', 'Connect']
                },
                {
                    id: member.id,
                    allow: ['ViewChannel', 'Connect', 'ManageChannels', 'MoveMembers']
                }
            ]
        });

        // Store room info
        this.activeRooms.set(member.id, voiceChannel.id);
        this.roomSettings.set(voiceChannel.id, {
            owner: member.id,
            createdAt: Date.now(),
            members: [member.id],
            settings: {
                userLimit: 5,
                locked: false,
                hidden: false
            }
        });

        // Set cooldown
        this.setupCooldowns.add(member.id);
        setTimeout(() => this.setupCooldowns.delete(member.id), 30000);

        // Auto cleanup after 5 minutes if empty
        setTimeout(async () => {
            const room = guild.channels.cache.get(voiceChannel.id);
            if (room && room.members.size === 0) {
                await this.deleteRoom(member.id, guild);
            }
        }, 300000); // 5 minutes

        return { success: true, channel: voiceChannel };
    }

    // Invite user to room
    async inviteToRoom(interaction, targetUserId) {
        const ownerId = interaction.user.id;
        const roomId = this.activeRooms.get(ownerId);
        
        if (!roomId) {
            return { error: 'You don\'t have a private room.' };
        }

        const guild = interaction.guild;
        const room = guild.channels.cache.get(roomId);
        
        if (!room) {
            this.activeRooms.delete(ownerId);
            return { error: 'Room not found.' };
        }

        // Add permission for invited user
        await room.permissionOverwrites.create(targetUserId, {
            ViewChannel: true,
            Connect: true
        });

        // Update room settings
        const settings = this.roomSettings.get(roomId);
        if (settings && !settings.members.includes(targetUserId)) {
            settings.members.push(targetUserId);
        }

        return { success: true, room };
    }

    // Delete room
    async deleteRoom(userId, guild) {
        const roomId = this.activeRooms.get(userId);
        if (!roomId) return { error: 'No room found.' };

        const room = guild.channels.cache.get(roomId);
        if (room) {
            try {
                await room.delete();
            } catch (error) {
                console.error('Failed to delete room:', error);
            }
        }

        this.activeRooms.delete(userId);
        this.roomSettings.delete(roomId);
        
        return { success: true };
    }

    // Get room stats
    getRoomStats(guild) {
        const stats = {
            totalRooms: this.activeRooms.size,
            activeUsers: 0,
            totalCapacity: 0
        };

        for (const [userId, roomId] of this.activeRooms) {
            const room = guild.channels.cache.get(roomId);
            if (room) {
                stats.activeUsers += room.members.size;
                stats.totalCapacity += room.userLimit || 0;
            }
        }

        return stats;
    }

    // Handle button interactions
    async handleButton(interaction) {
        const buttonId = interaction.customId;
        const member = interaction.member;

        switch (buttonId) {
            case 'dnd_join':
                await interaction.deferReply({ ephemeral: true });
                const result = await this.createPrivateRoom(interaction);
                
                if (result.error) {
                    await interaction.editReply({ content: `❌ ${result.error}` });
                } else {
                    await interaction.editReply({ 
                        content: `✅ Created private room: ${result.channel}\nUse the buttons below to manage it.` 
                    });
                }
                break;

            case 'dnd_leave':
                await interaction.deferReply({ ephemeral: true });
                const deleteResult = await this.deleteRoom(member.id, interaction.guild);
                
                if (deleteResult.error) {
                    await interaction.editReply({ content: `❌ ${deleteResult.error}` });
                } else {
                    await interaction.editReply({ content: '✅ Your private room has been deleted.' });
                }
                break;

            case 'dnd_stats':
                const stats = this.getRoomStats(interaction.guild);
                const statsEmbed = {
                    color: 0x4ECDC4,
                    title: '📊 DnD Room Statistics',
                    fields: [
                        { name: 'Total Rooms', value: stats.totalRooms.toString(), inline: true },
                        { name: 'Active Users', value: stats.activeUsers.toString(), inline: true },
                        { name: 'Total Capacity', value: stats.totalCapacity.toString(), inline: true }
                    ],
                    footer: { text: `Kudumbasree DnD System` },
                    timestamp: new Date()
                };
                
                await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
                break;

            case 'dnd_invite':
                // Create invite modal
                const modal = new ModalBuilder()
                    .setCustomId('dnd_invite_modal')
                    .setTitle('Invite User to Room');

                const userIdInput = new TextInputBuilder()
                    .setCustomId('user_id')
                    .setLabel("User ID to invite")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(userIdInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
                break;

            default:
                await interaction.reply({ 
                    content: '🚧 This feature is coming soon!', 
                    ephemeral: true 
                });
        }
    }
}

module.exports = DnDSystem;