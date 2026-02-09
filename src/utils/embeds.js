const { EmbedBuilder } = require('discord.js');

class EmbedGenerator {
    constructor(client) {
        this.client = client;
        this.colors = {
            primary: 0xFF6B6B,
            secondary: 0x4ECDC4,
            accent: 0x45B7D1,
            success: 0x96CEB4,
            warning: 0xFFEAA7,
            error: 0xFF6B6B
        };
    }

    createBasic(title, description, color = 'primary') {
        return new EmbedBuilder()
            .setColor(this.colors[color] || this.colors.primary)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ 
                text: `Kudumbasree Manager • Dev: ${this.client.config.developer}`,
                iconURL: this.client.user?.displayAvatarURL() 
            });
    }

    createSuccess(title, description) {
        return this.createBasic(title, description, 'success');
    }

    createError(title, description) {
        return this.createBasic(title, description, 'error');
    }

    createLogEmbed(event, user, details, guild) {
        const eventColors = {
            'VOICE_JOIN': this.colors.accent,
            'VOICE_LEAVE': this.colors.accent,
            'MESSAGE_DELETE': this.colors.error,
            'MEMBER_JOIN': this.colors.success,
            'MEMBER_LEAVE': this.colors.error,
            'ROLE_ADD': this.colors.warning
        };

        return new EmbedBuilder()
            .setColor(eventColors[event] || this.colors.primary)
            .setTitle(`[${event}]`)
            .setDescription(details)
            .addFields(
                { name: '👤 User', value: user?.tag || 'Unknown', inline: true },
                { name: '🆔 ID', value: user?.id || 'Unknown', inline: true },
                { name: '🕒 Time', value: `<t:${Math.floor(Date.now()/1000)}:R>`, inline: true }
            )
            .setFooter({ 
                text: `Kudumbasree Logs • Dev: ${this.client.config.developer}`,
                iconURL: guild?.iconURL() || this.client.user?.displayAvatarURL()
            })
            .setTimestamp();
    }
}

module.exports = EmbedGenerator;