const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc-swap')
        .setDescription('Swap members between two voice channels')
        .addChannelOption(option =>
            option.setName('channel1')
                .setDescription('First voice channel')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel2')
                .setDescription('Second voice channel')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply();
        
        const channel1 = interaction.options.getChannel('channel1');
        const channel2 = interaction.options.getChannel('channel2');
        
        if (!channel1.isVoiceBased() || !channel2.isVoiceBased()) {
            return interaction.editReply({
                content: '❌ Both selections must be voice channels',
                ephemeral: true
            });
        }
        
        if (channel1.id === channel2.id) {
            return interaction.editReply({
                content: '❌ Cannot swap with the same channel',
                ephemeral: true
            });
        }
        
        const members1 = Array.from(channel1.members.values());
        const members2 = Array.from(channel2.members.values());
        
        let moved1to2 = 0;
        let moved2to1 = 0;
        let errors = [];
        
        // Move channel1 members to channel2
        for (const member of members1) {
            try {
                await member.voice.setChannel(channel2);
                moved1to2++;
            } catch (error) {
                errors.push(`${member.user.tag}: ${error.message}`);
            }
        }
        
        // Move channel2 members to channel1
        for (const member of members2) {
            try {
                await member.voice.setChannel(channel1);
                moved2to1++;
            } catch (error) {
                errors.push(`${member.user.tag}: ${error.message}`);
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('🔄 Voice Channel Swap')
            .setDescription(`Swapped members between ${channel1} and ${channel2}`)
            .addFields(
                { name: `→ ${channel2.name}`, value: `${moved1to2} members`, inline: true },
                { name: `→ ${channel1.name}`, value: `${moved2to1} members`, inline: true },
                { name: 'Total Moved', value: `${moved1to2 + moved2to1} members`, inline: true }
            )
            .setFooter({ 
                text: `Kudumbasree Manager • Dev: ${interaction.client.config.developer}`,
                iconURL: interaction.guild.iconURL()
            })
            .setTimestamp();
        
        if (errors.length > 0) {
            embed.addFields({
                name: '⚠️ Errors',
                value: errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n...and ${errors.length - 3} more` : '')
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};