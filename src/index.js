const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const http = require('http');
const DnDSystem = require('./modules/dndSystem');
const LoggingSystem = require('./modules/loggingSystem');
const PollSystem = require('./modules/pollSystem');
const StatusRotator = require('./utils/statusRotator');

dotenv.config();

class KudumbasreeBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildModeration,
            ],
            partials: ['CHANNEL', 'MESSAGE', 'GUILD_MEMBER', 'REACTION']
        });

        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.config = {
            colorPalette: {
                primary: '#FF6B6B',
                secondary: '#4ECDC4',
                accent: '#45B7D1',
                success: '#96CEB4',
                warning: '#FFEAA7',
                error: '#FF6B6B'
            },
            developer: '***RIO-SEC***',
            version: '2.0.0'
        };

        // Initialize database if DATABASE_URL exists
        if (process.env.DATABASE_URL) {
            this.db = this.initializeDatabase();
        } else {
            console.log('⚠️  Running without database - using memory storage');
            this.db = null;
        }

        // Initialize systems
        this.dndSystem = new DnDSystem(this);
        this.loggingSystem = new LoggingSystem(this);
        this.pollSystem = new PollSystem();
        this.statusRotator = new StatusRotator(this);
    }

    initializeDatabase() {
        try {
            const sequelize = new Sequelize(process.env.DATABASE_URL, {
                logging: process.env.NODE_ENV === 'development' ? console.log : false,
                dialectOptions: {
                    ssl: process.env.NODE_ENV === 'production' ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });

            return sequelize;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return null;
        }
    }

    async loadHandlers() {
        const handlerPath = path.join(__dirname, 'handlers');
        const handlerFiles = fs.readdirSync(handlerPath).filter(file => file.endsWith('.js'));

        for (const file of handlerFiles) {
            try {
                const handler = require(path.join(handlerPath, file));
                await handler(this);
                console.log(`✅ Loaded handler: ${file}`);
            } catch (error) {
                console.error(`❌ Failed to load handler ${file}:`, error);
            }
        }
    }

    startHealthServer() {
        const server = http.createServer((req, res) => {
            if (req.url === '/health') {
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    guilds: this.guilds.cache.size,
                    commands: this.commands.size
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(health, null, 2));
            } else if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>Kudumbasree Bot</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px; background: #2D3047; color: white;">
                            <h1>🤖 Kudumbasree Bot v${this.config.version}</h1>
                            <p>Status: <span style="color: #96CEB4;">● Online</span></p>
                            <p>Servers: ${this.guilds.cache.size}</p>
                            <p>Uptime: ${Math.floor(process.uptime() / 60)} minutes</p>
                            <p>Developer: ${this.config.developer}</p>
                            <p><a href="/health" style="color: #4ECDC4;">Health Check JSON</a></p>
                        </body>
                    </html>
                `);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`✅ Health server: http://localhost:${PORT}`);
        });

        this.healthServer = server;
    }

    async start() {
        try {
            console.log('🚀 Starting Kudumbasree Bot v2.0.0...');
            
            // Login first
            await this.login(process.env.DISCORD_TOKEN);
            console.log(`✅ Logged in as ${this.user.tag}`);
            
            // Start status rotation after bot is ready
            this.statusRotator.startRotation();
            console.log('✅ Status rotation started');
            
            // Load handlers
            await this.loadHandlers();
            
            // Initialize systems
            this.loggingSystem.setupListeners();
            console.log('✅ Logging system initialized');
            
            // Start health server
            this.startHealthServer();
            
            console.log(`\n🎉 Bot is fully ready!`);
            console.log(`📊 Servers: ${this.guilds.cache.size}`);
            console.log(`⚡ Commands: ${this.commands.size}`);
            console.log(`📈 Systems: DnD, Logging, Polls`);
            console.log(`👤 Developer: ${this.config.developer}`);
            
            // Set status
            this.user.setActivity({
                name: `with ${this.commands.size} features`,
                type: 0 // PLAYING
            });
            
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }
}

// Create and start bot
const bot = new KudumbasreeBot();
bot.start();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await bot.destroy();
    if (bot.healthServer) bot.healthServer.close();
    if (bot.db) await bot.db.close();
    console.log('👋 Bot stopped');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});