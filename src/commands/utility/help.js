const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all bot commands'),

    async execute(interaction) {
        const commands = interaction.client.commands;
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🤖 Kudumbasree Bot Commands')
            .setDescription(`Total: ${commands.size} commands\nUse \`/\` to see all slash commands`)
            .setFooter({ 
                text: `Kudumbasree Manager • Dev: ***RIO-SEC***`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Categorize commands
        const categories = {
            '🎮 DnD System': [],
            '📊 Logging': [],
            '🎯 Voice Control': [],
            '📢 Announcements': [],
            '👥 Community': [],
            '🛠️ Utility': []
        };

        commands.forEach(cmd => {
            const name = cmd.data.name;
            
            if (name.includes('dnd')) categories['🎮 DnD System'].push(name);
            else if (name.includes('log')) categories['📊 Logging'].push(name);
            else if (name.includes('vc') || name.includes('voice')) categories['🎯 Voice Control'].push(name);
            else if (name.includes('announce') || name.includes('dm') || name.includes('autorole')) categories['📢 Announcements'].push(name);
            else if (name.includes('welcome') || name.includes('goodbye') || name.includes('poll')) categories['👥 Community'].push(name);
            else categories['🛠️ Utility'].push(name);
        });

        // Add fields for each category
        Object.entries(categories).forEach(([category, cmds]) => {
            if (cmds.length > 0) {
                embed.addFields({
                    name: category,
                    value: cmds.map(cmd => `\`/${cmd}\``).join(', '),
                    inline: false
                });
            }
        });

        await interaction.reply({ embeds: [embed] });
    }
};