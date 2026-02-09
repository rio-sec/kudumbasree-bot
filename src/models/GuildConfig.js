const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('GuildConfig', {
        guild_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },
        welcome_channel_id: DataTypes.STRING,
        welcome_message: {
            type: DataTypes.TEXT,
            defaultValue: "Welcome {user} to {server}! 🎉 You're member #{count}"
        },
        goodbye_channel_id: DataTypes.STRING,
        auto_role_id: DataTypes.STRING,
        log_category_id: DataTypes.STRING,
        dnd_category_id: DataTypes.STRING,
        poll_category_id: DataTypes.STRING
    }, {
        tableName: 'guild_configs',
        timestamps: true
    });
};