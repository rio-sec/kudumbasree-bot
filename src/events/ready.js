module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`\n========================================`);
        console.log(`🤖 ${client.user.tag} is ready!`);
        console.log(`📊 Servers: ${client.guilds.cache.size}`);
        console.log(`⚡ Commands: ${client.commands.size}`);
        console.log(`🎨 Developer: ${client.config.developer}`);
        console.log(`🌐 Health: http://localhost:${process.env.PORT || 3000}`);
        console.log(`========================================\n`);
        
        // Set bot status
        client.user.setActivity({
            name: `in ${client.guilds.cache.size} servers`,
            type: 3 // WATCHING
        });
    }
};