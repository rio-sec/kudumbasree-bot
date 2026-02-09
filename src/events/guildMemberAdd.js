const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            // Send welcome message
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🎉 Welcome!')
                .setDescription(`Welcome ${member} to **${member.guild.name}**! 🎉\nYou're member #${member.guild.memberCount}`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Kudumbasree Manager • Dev: ${client.config.developer}`,
                    iconURL: member.guild.iconURL()
                })
                .setTimestamp();
            
            // Try to send to system channel
            if (member.guild.systemChannel) {
                await member.guild.systemChannel.send({ embeds: [embed] });
            }
            
            // Try to send DM
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#4ECDC4')
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription('Thanks for joining our community!')
                    .addFields(
                        { name: '📊 Members', value: `${member.guild.memberCount}`, inline: true },
                        { name: '📅 Created', value: `<t:${Math.floor(member.guild.createdTimestamp/1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: `Kudumbasree Manager • Dev: ${client.config.developer}` })
                    .setTimestamp();
                
                await member.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // User has DMs closed, that's okay
            }
            
        } catch (error) {
            console.error('Welcome message error:', error);
        }
    }
};