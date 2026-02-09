const { ActivityType } = require('discord.js');

class StatusRotator {
    constructor(client) {
        this.client = client;
        this.statuses = [];
        this.currentIndex = 0;
        this.interval = null;
        this.enabled = true;
        this.rotationInterval = 300000; // 5 minutes

        this.loadDefaultStatuses();
    }

    loadDefaultStatuses() {
        this.statuses = [
            {
                name: `${this.client.guilds.cache.size} servers`,
                type: ActivityType.Watching,
                status: 'online'
            },
            {
                name: '/help commands',
                type: ActivityType.Listening,
                status: 'online'
            },
            {
                name: 'with Discord API',
                type: ActivityType.Playing,
                status: 'online'
            },
            {
                name: 'your voice chats',
                type: ActivityType.Watching,
                status: 'online'
            },
            {
                name: 'Kudumbasree Manager',
                type: ActivityType.Playing,
                status: 'online'
            },
            {
                name: '👨‍💻 Dev: ***RIO-SEC***',
                type: ActivityType.Custom,
                status: 'online',
                state: 'Building awesome bots!'
            },
            {
                name: 'premium features',
                type: ActivityType.Playing,
                status: 'online'
            },
            {
                name: 'DnD sessions',
                type: ActivityType.Watching,
                status: 'idle'
            }
        ];
    }

    addStatus(name, type = 'playing', status = 'online') {
        const typeMap = {
            playing: ActivityType.Playing,
            listening: ActivityType.Listening,
            watching: ActivityType.Watching,
            streaming: ActivityType.Streaming,
            competing: ActivityType.Competing,
            custom: ActivityType.Custom
        };

        this.statuses.push({
            name,
            type: typeMap[type] || ActivityType.Playing,
            status
        });
    }

    startRotation() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        // Initial status
        this.setNextStatus();

        // Start rotation
        this.interval = setInterval(() => {
            if (this.enabled) {
                this.setNextStatus();
            }
        }, this.rotationInterval);

        console.log('✅ Status rotation started');
    }

    setNextStatus() {
        if (this.statuses.length === 0) return;

        const status = this.statuses[this.currentIndex];
        
        try {
            // Update server count in relevant statuses
            if (status.name.includes('{servers}')) {
                status.name = status.name.replace('{servers}', this.client.guilds.cache.size);
            }

            // Set status
            this.client.user.setStatus(status.status);
            
            // Set activity
            if (status.type === ActivityType.Custom && status.state) {
                this.client.user.setActivity({
                    name: status.name,
                    state: status.state,
                    type: status.type
                });
            } else {
                this.client.user.setActivity({
                    name: status.name,
                    type: status.type
                });
            }

            // Move to next status
            this.currentIndex = (this.currentIndex + 1) % this.statuses.length;

        } catch (error) {
            console.error('Failed to set status:', error);
        }
    }

    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('⏹️ Status rotation stopped');
        }
    }

    setRotationInterval(ms) {
        this.rotationInterval = ms;
        if (this.interval) {
            this.stopRotation();
            this.startRotation();
        }
    }

    getCurrentStatus() {
        if (this.statuses.length === 0) return null;
        return this.statuses[(this.currentIndex - 1 + this.statuses.length) % this.statuses.length];
    }

    getStatusList() {
        return this.statuses.map((status, index) => {
            const isCurrent = index === ((this.currentIndex - 1 + this.statuses.length) % this.statuses.length);
            return {
                index,
                name: status.name,
                type: ActivityType[status.type] || 'Playing',
                status: status.status,
                current: isCurrent
            };
        });
    }

    enable() {
        this.enabled = true;
        if (!this.interval) {
            this.startRotation();
        }
    }

    disable() {
        this.enabled = false;
        this.stopRotation();
    }
}

module.exports = StatusRotator;