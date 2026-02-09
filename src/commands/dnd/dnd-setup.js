const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dnd-setup')
        .setDescription('Setup DnD voice room system')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Category for DnD rooms')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const category = interaction.options.getChannel('category');
        if (category.type !== 4) { // GUILD_CATEGORY
            return interaction.editReply({
                content: '❌ Please select a category, not a channel',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#45B7D1')
            .setTitle('🎮 DnD Voice Control Panel')
            .setDescription('Create and manage private voice rooms for focused sessions')
            .addFields(
                { name: '🟢 JOIN DND', value: 'Create a private voice room', inline: true },
                { name: '🔧 MY ROOM', value: 'Configure your room settings', inline: true },
                { name: '🚪 LEAVE', value: 'Delete your private room', inline: true },
                { name: '📨 INVITE', value: 'Invite users to your room', inline: true },
                { name: '👥 VISIT', value: 'Browse available rooms', inline: true },
                { name: '📊 STATS', value: 'View room statistics', inline: true }
            )
            .setFooter({ 
                text: `Kudumbasree Manager • Dev: ${interaction.client.config.developer}`,
                iconURL: interaction.guild.iconURL()
            });

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_dnd')
                    .setLabel('JOIN DND')
                    .setEmoji('🟢')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('room_settings')
                    .setLabel('MY ROOM')
                    .setEmoji('🔧')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('leave_dnd')
                    .setLabel('LEAVE')
                    .setEmoji('🚪')
                    .setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('invite_users')
                    .setLabel('INVITE')
                    .setEmoji('📨')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('visit_rooms')
                    .setLabel('VISIT')
                    .setEmoji('👥')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('room_stats')
                    .setLabel('STATS')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            content: `✅ DnD system setup in ${category}. Use the panel below:`,
            embeds: [embed],
            components: [row1, row2]
        });
    }
};