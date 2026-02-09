const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll-create')
        .setDescription('Create a poll with hidden results')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('Option 1')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Option 2')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Option 3')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Option 4')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (default: 1440)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const duration = interaction.options.getInteger('duration') || 1440; // 24 hours default
        
        // Collect options
        const options = [];
        for (let i = 1; i <= 4; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) options.push(option);
        }

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle(`📊 Poll: ${question}`)
            .setDescription(`**Vote using buttons below!**\n\n⏰ Ends in: ${duration} minutes\n👥 Total Votes: 0\n📝 Options:`)
            .setFooter({ 
                text: `Poll System • Created by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add options to embed
        options.forEach((option, index) => {
            embed.addFields({
                name: `${index + 1}. ${option}`,
                value: `░░░░░░░░░░ 0% (0 votes)`,
                inline: false
            });
        });

        // Create buttons for voting
        const rows = [];
        for (let i = 0; i < options.length; i++) {
            if (i % 5 === 0) rows.push(new ActionRowBuilder());
            
            const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i];
            rows[Math.floor(i / 5)].addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${i}`)
                    .setLabel(`${i + 1}. ${options[i].slice(0, 20)}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji(emoji)
            );
        }

        // Add control buttons
        const controlRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('poll_results')
                    .setLabel('Show Results')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('poll_end')
                    .setLabel('End Poll')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏹️')
            );
        
        rows.push(controlRow);

        await interaction.reply({ 
            content: `📊 New poll created by ${interaction.user}`,
            embeds: [embed], 
            components: rows 
        });
    }
};