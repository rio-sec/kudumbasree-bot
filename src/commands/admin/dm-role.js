const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm-role')
        .setDescription('DM all members with a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to DM')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const message = interaction.options.getString('message');
        
        await interaction.deferReply({ ephemeral: true });
        
        const members = role.members;
        let sent = 0;
        let failed = 0;
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('📨 Role DM Announcement')
            .setDescription(message)
            .setFooter({ 
                text: `From: ${interaction.guild.name}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();

        for (const member of members.values()) {
            try {
                await member.send({ embeds: [embed] });
                sent++;
                // Rate limit protection
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                failed++;
            }
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(sent > 0 ? '#2ecc71' : '#e74c3c')
            .setTitle('📊 DM Results')
            .addFields(
                { name: '✅ Sent', value: sent.toString(), inline: true },
                { name: '❌ Failed', value: failed.toString(), inline: true },
                { name: '🎯 Target Role', value: role.name, inline: true }
            )
            .setFooter({ text: 'Kudumbasree Announcement System' });

        await interaction.editReply({ embeds: [resultEmbed] });
    }
};