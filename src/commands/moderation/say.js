const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message content to send')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send message to (default: current channel)')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
        .addStringOption(option =>
            option.setName('embed')
                .setDescription('Send as embed?')
                .addChoices(
                    { name: 'Yes (Embed)', value: 'yes' },
                    { name: 'No (Plain Text)', value: 'no' }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Embed color (if using embed)')
                .addChoices(
                    { name: '🔴 Red', value: 'Red' },
                    { name: '🔵 Blue', value: 'Blue' },
                    { name: '🟢 Green', value: 'Green' },
                    { name: '🟡 Yellow', value: 'Yellow' },
                    { name: '🟣 Purple', value: 'Purple' },
                    { name: '🧡 Orange', value: 'Orange' },
                    { name: '💗 Pink', value: 'Pink' }
                )
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const useEmbed = interaction.options.getString('embed') === 'yes';
        const colorChoice = interaction.options.getString('color') || 'Blue';
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Check bot permissions in target channel
            const botPermissions = channel.permissionsFor(interaction.guild.members.me);
            if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
                return interaction.editReply({
                    content: `❌ I don't have permission to send messages in ${channel}`,
                    ephemeral: true
                });
            }
            
            if (useEmbed) {
                // Send as embed
                const colors = {
                    'Red': 0xff0000,
                    'Blue': 0x0000ff,
                    'Green': 0x00ff00,
                    'Yellow': 0xffff00,
                    'Purple': 0x800080,
                    'Orange': 0xffa500,
                    'Pink': 0xffc0cb
                };
                
                const embed = new EmbedBuilder()
                    .setColor(colors[colorChoice] || 0x0000ff)
                    .setDescription(message)
                    .setFooter({ 
                        text: `Sent by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await channel.send({ embeds: [embed] });
                
            } else {
                // Send as plain text
                await channel.send(message);
            }
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('📢 Message Sent')
                .addFields(
                    { name: '📁 Channel', value: `${channel}`, inline: true },
                    { name: '📝 Type', value: useEmbed ? 'Embed' : 'Plain Text', inline: true },
                    { name: '👤 Sent By', value: `${interaction.user}`, inline: true },
                    { name: '📄 Content', value: message.length > 500 ? message.substring(0, 500) + '...' : message, inline: false }
                )
                .setFooter({ text: 'Say Command • Kudumbasree Bot' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [successEmbed] });
            
            // Log to moderation channel
            if (interaction.client.loggingSystem) {
                await interaction.client.loggingSystem.log('MESSAGE_SEND', {
                    moderator: interaction.user,
                    channel: channel,
                    guild: interaction.guild,
                    content: message,
                    type: useEmbed ? 'embed' : 'text'
                });
            }
            
        } catch (error) {
            console.error('Say command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle('❌ Failed to Send Message')
                .setDescription(`Error: ${error.message}`)
                .addFields(
                    { name: '💡 Check', value: '1. Bot permissions\n2. Channel exists\n3. Message length', inline: false }
                );
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};