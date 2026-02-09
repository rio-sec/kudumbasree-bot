const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole-setup')
        .setDescription('Setup auto-role for new members')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to auto-assign')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('delay')
                .setDescription('Delay in seconds (0-60)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(60))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const delay = interaction.options.getInteger('delay') || 0;

        // Check bot's permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ I need "Manage Roles" permission!',
                ephemeral: true
            });
        }

        // Check role hierarchy
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ I cannot assign this role (too high in hierarchy)!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('⚙️ Auto-Role Setup Complete')
            .addFields(
                { name: '🎭 Role', value: `${role}`, inline: true },
                { name: '⏱️ Delay', value: `${delay} seconds`, inline: true },
                { name: '📊 Members', value: `${role.members.size} have this role`, inline: true }
            )
            .setFooter({ 
                text: `New members will receive this role automatically`,
                iconURL: interaction.guild.iconURL()
            });

        await interaction.reply({ 
            embeds: [embed],
            ephemeral: true 
        });
    }
};