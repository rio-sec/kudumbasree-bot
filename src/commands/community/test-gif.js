const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-gif')
        .setDescription('Test if your GIF works in Discord')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Your GIF URL to test')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: false });
            
            const gifUrl = interaction.options.getString('url');
            
            // Validate URL
            if (!gifUrl.includes('.gif')) {
                return interaction.editReply({
                    content: '❌ **URL must end with .gif**\n\nExamples:\n`https://media.tenor.com/XXXXX.gif`\n`https://i.giphy.com/media/XXXXX/giphy.gif`'
                });
            }
            
            // Test embed
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🎬 GIF TEST RESULT')
                .setDescription(`Testing URL:\n\`${gifUrl}\``)
                .setImage(gifUrl)
                .addFields(
                    { name: '✅ If you see GIF above', value: 'Works in Discord!', inline: true },
                    { name: '❌ If broken image', value: 'Won\'t work in welcome', inline: true }
                )
                .setFooter({ text: 'Use this URL in /welcome-setup' });
            
            await interaction.editReply({ 
                content: '**Testing your GIF URL...**',
                embeds: [embed] 
            });
            
            // Also test as attachment
            setTimeout(async () => {
                try {
                    await interaction.followUp({
                        content: `**Direct link test:**\n${gifUrl}\n\nIf both show broken images, the GIF URL is invalid.`,
                        ephemeral: false
                    });
                } catch (error) {
                    console.error('Follow-up error:', error);
                }
            }, 1000);
            
        } catch (error) {
            console.error('GIF test error:', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}\n\n**Try these GIF hosts:**\n1. https://giphy.com/\n2. https://tenor.com/\n3. Upload to Discord first`
            });
        }
    }
};