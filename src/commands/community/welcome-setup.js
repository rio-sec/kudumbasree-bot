const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Setup welcome messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for welcome messages')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Welcome message (use {user}, {server}, {count})')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message') || 
            "Welcome {user} to **{server}**! 🎉 You're member #{count}";

        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('👋 Welcome System Setup')
            .addFields(
                { name: '📁 Channel', value: `${channel}`, inline: true },
                { name: '📝 Message', value: message, inline: false },
                { name: '✨ Variables', value: '`{user}` - User mention\n`{server}` - Server name\n`{count}` - Member count', inline: false }
            )
            .setFooter({ 
                text: `Kudumbasree Welcome System • Dev: ***RIO-SEC***`,
                iconURL: interaction.guild.iconURL()
            });

        await interaction.reply({ 
            content: `✅ Welcome messages will be sent to ${channel}`,
            embeds: [embed],
            ephemeral: true 
        });
    }
};