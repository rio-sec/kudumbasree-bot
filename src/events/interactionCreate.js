module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle buttons
        if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            // Handle DnD buttons
            if (buttonId === 'join_dnd') {
                await interaction.reply({ 
                    content: '🚧 DnD system coming soon!', 
                    ephemeral: true 
                });
            }
            // Add other button handlers...
            
            return;
        }
        
        // Handle slash commands
        if (!interaction.isChatInputCommand()) return;
        
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            
            const errorEmbed = {
                color: 0xFF6B6B,
                title: '❌ Command Error',
                description: 'There was an error executing this command.',
                footer: { text: `Dev: ${client.config.developer}` },
                timestamp: new Date()
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};