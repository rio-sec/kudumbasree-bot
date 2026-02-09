const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class PollSystem {
    constructor() {
        this.activePolls = new Map();
        this.votes = new Map();
    }

    // Create a poll
    async createPoll(interaction, question, options, duration) {
        const pollId = `${interaction.guildId}-${Date.now()}`;
        
        const poll = {
            id: pollId,
            question,
            options,
            creator: interaction.user.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            createdAt: Date.now(),
            endsAt: Date.now() + (duration * 60000), // minutes to ms
            votes: {},
            voters: new Set()
        };

        this.activePolls.set(pollId, poll);
        this.votes.set(pollId, new Map());

        // Create poll embed
        const embed = this.createPollEmbed(poll);
        const components = this.createPollButtons(poll);

        const message = await interaction.reply({ 
            embeds: [embed], 
            components,
            fetchReply: true 
        });

        poll.messageId = message.id;
        
        // Auto-end poll timer
        setTimeout(() => this.endPoll(pollId), duration * 60000);

        return poll;
    }

    // Create poll embed
    createPollEmbed(poll, showResults = false) {
        const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
        const timeLeft = Math.max(0, poll.endsAt - Date.now());
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        const embed = new EmbedBuilder()
            .setColor(0x4ECDC4)
            .setTitle('📊 Poll: ' + poll.question)
            .setFooter({ text: `Poll ID: ${poll.id.slice(-6)} • Created by ${poll.creator}` })
            .setTimestamp(poll.createdAt);

        if (!showResults) {
            embed.setDescription(`**Vote using the buttons below!**\n\n` +
                               `⏰ Ends in: ${hoursLeft}h ${minutesLeft}m\n` +
                               `👥 Total Votes: ${totalVotes}\n` +
                               `📝 Options:`);

            poll.options.forEach((option, index) => {
                const votes = poll.votes[index] || 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const bar = this.createProgressBar(percentage, 10);
                
                embed.addFields({
                    name: `${index + 1}. ${option}`,
                    value: `${bar} ${percentage}% (${votes} votes)`,
                    inline: false
                });
            });
        } else {
            embed.setDescription(`**📈 Final Results**\n\n` +
                               `👥 Total Votes: ${totalVotes}\n` +
                               `📝 Options:`);

            // Sort by votes
            const sortedOptions = poll.options
                .map((option, index) => ({
                    option,
                    votes: poll.votes[index] || 0,
                    index
                }))
                .sort((a, b) => b.votes - a.votes);

            sortedOptions.forEach((item, position) => {
                const percentage = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
                const bar = this.createProgressBar(percentage, 15);
                const medal = position === 0 ? '🥇' : position === 1 ? '🥈' : position === 2 ? '🥉' : '▫️';
                
                embed.addFields({
                    name: `${medal} ${position + 1}. ${item.option}`,
                    value: `${bar} **${percentage}%** (${item.votes} votes)`,
                    inline: false
                });
            });
        }

        return embed;
    }

    // Create progress bar
    createProgressBar(percentage, length) {
        const filled = Math.round((percentage / 100) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    // Create poll buttons
    createPollButtons(poll) {
        const rows = [];
        const optionsPerRow = 5;

        for (let i = 0; i < poll.options.length; i += optionsPerRow) {
            const row = new ActionRowBuilder();
            const slice = poll.options.slice(i, i + optionsPerRow);

            slice.forEach((option, index) => {
                const optionNumber = i + index + 1;
                const votes = poll.votes[optionNumber - 1] || 0;

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`poll_${poll.id}_${optionNumber - 1}`)
                        .setLabel(`${optionNumber}. ${option.slice(0, 20)}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(this.getNumberEmoji(optionNumber))
                );
            });

            rows.push(row);
        }

        // Add control buttons
        const controlRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_results_${poll.id}`)
                    .setLabel('Show Results')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId(`poll_end_${poll.id}`)
                    .setLabel('End Poll')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏹️')
            );

        rows.push(controlRow);

        return rows;
    }

    getNumberEmoji(num) {
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        return emojis[num - 1] || num.toString();
    }

    // Handle vote
    async handleVote(interaction, pollId, optionIndex) {
        const poll = this.activePolls.get(pollId);
        if (!poll) {
            return interaction.reply({ 
                content: '❌ Poll not found or has ended.', 
                ephemeral: true 
            });
        }

        // Check if user already voted
        if (poll.voters.has(interaction.user.id)) {
            return interaction.reply({ 
                content: '❌ You have already voted in this poll!', 
                ephemeral: true 
            });
        }

        // Register vote
        poll.votes[optionIndex] = (poll.votes[optionIndex] || 0) + 1;
        poll.voters.add(interaction.user.id);

        // Update poll message
        const embed = this.createPollEmbed(poll);
        try {
            const channel = await interaction.client.channels.fetch(poll.channelId);
            const message = await channel.messages.fetch(poll.messageId);
            await message.edit({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to update poll:', error);
        }

        await interaction.reply({ 
            content: `✅ You voted for: **${poll.options[optionIndex]}**`, 
            ephemeral: true 
        });
    }

    // End poll
    async endPoll(pollId) {
        const poll = this.activePolls.get(pollId);
        if (!poll) return;

        // Remove from active polls
        this.activePolls.delete(pollId);

        // Show final results
        const embed = this.createPollEmbed(poll, true);
        const channel = await this.client.channels.fetch(poll.channelId);
        
        try {
            const message = await channel.messages.fetch(poll.messageId);
            await message.edit({ 
                embeds: [embed], 
                components: [] 
            });

            // Announce results
            const resultsEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle('📊 Poll Ended!')
                .setDescription(`**${poll.question}**\n\nTotal Votes: ${Object.values(poll.votes).reduce((a, b) => a + b, 0)}`)
                .setFooter({ text: 'Poll System • Kudumbasree Bot' })
                .setTimestamp();

            await channel.send({ embeds: [resultsEmbed] });
        } catch (error) {
            console.error('Failed to end poll:', error);
        }
    }

    // Get poll statistics
    getPollStats(guildId) {
        const guildPolls = Array.from(this.activePolls.values())
            .filter(poll => poll.guildId === guildId);

        return {
            activePolls: guildPolls.length,
            totalVotes: guildPolls.reduce((total, poll) => 
                total + Object.values(poll.votes).reduce((a, b) => a + b, 0), 0
            ),
            uniqueVoters: new Set(guildPolls.flatMap(poll => Array.from(poll.voters))).size
        };
    }
}

module.exports = PollSystem;