const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show server information'),

    async execute(interaction) {
        const guild = interaction.guild;
        
        // Calculate server stats
        const memberCount = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.isTextBased()).size;
        const voiceChannels = channels.filter(c => c.isVoiceBased()).size;
        
        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;
        
        const embed = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle(`📊 ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 512 }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp/1000)}:D>`, inline: true },
                { name: '👥 Members', value: `${memberCount}\n🟢 ${onlineMembers} online\n🤖 ${botCount} bots`, inline: true },
                { name: '📁 Channels', value: `${channels.size}\n💬 ${textChannels} text\n🔊 ${voiceChannels} voice`, inline: true },
                { name: '🎨 Assets', value: `🎭 ${roles} roles\n😀 ${emojis} emojis\n📈 ${guild.premiumSubscriptionCount} boosts`, inline: true }
            )
            .setFooter({ 
                text: `Kudumbasree Manager • Server ID: ${guild.id}`,
                iconURL: guild.iconURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};