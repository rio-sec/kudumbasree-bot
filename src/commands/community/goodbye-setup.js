const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('goodbye-setup')
        .setDescription('Setup goodbye messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for goodbye messages')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Goodbye message (use {user}, {server})')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message') || 
            "Goodbye **{user}**! 👋 Thanks for being part of **{server}**.";

        const embed = new EmbedBuilder()
            .setColor('#45B7D1')
            .setTitle('👋 Goodbye System Setup')
            .addFields(
                { name: '📁 Channel', value: `${channel}`, inline: true },
                { name: '📝 Message', value: message, inline: false }
            )
            .setFooter({ 
                text: `Kudumbasree Welcome System • Dev: ***RIO-SEC***`
            });

        await interaction.reply({ 
            content: `✅ Goodbye messages will be sent to ${channel}`,
            embeds: [embed],
            ephemeral: true 
        });
    }
};