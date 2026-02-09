const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc-move-all')
        .setDescription('Move all server members to specified voice channel')
        .addChannelOption(option =>
            option.setName('destination')
                .setDescription('Destination voice channel')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const destination = interaction.options.getChannel('destination');
        if (!destination.isVoiceBased()) {
            return interaction.editReply({
                content: '❌ Please select a voice channel',
                ephemeral: true
            });
        }

        // Get all voice channel members
        const voiceMembers = [];
        interaction.guild.channels.cache.forEach(channel => {
            if (channel.isVoiceBased()) {
                channel.members.forEach(member => {
                    voiceMembers.push(member);
                });
            }
        });

        if (voiceMembers.length === 0) {
            return interaction.editReply({
                content: '❌ No users are currently in voice channels',
                ephemeral: true
            });
        }

        // Move members
        const moved = [];
        const failed = [];

        for (const member of voiceMembers) {
            try {
                await member.voice.setChannel(destination.id);
                moved.push(member.user.tag);
            } catch (error) {
                failed.push(`${member.user.tag}: ${error.message}`);
            }
        }

        // Create response embed
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🎯 Voice Channel Mass Move')
            .setDescription(`Moved members to ${destination}`)
            .addFields(
                { name: '✅ Successfully Moved', value: moved.length.toString(), inline: true },
                { name: '❌ Failed', value: failed.length.toString(), inline: true },
                { name: '🏁 Destination', value: destination.name, inline: true }
            )
            .setFooter({ 
                text: `Kudumbasree Manager • Dev: ${interaction.client.config.developer}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        if (failed.length > 0) {
            embed.addFields({
                name: '⚠️ Failed Moves',
                value: failed.slice(0, 5).join('\n') + (failed.length > 5 ? `\n...and ${failed.length - 5} more` : '')
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};