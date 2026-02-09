const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('UserData', {
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        guild_id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        dnd_room_id: DataTypes.STRING,
        dnd_settings: {
            type: DataTypes.JSON,
            defaultValue: {}
        },
        poll_votes: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        command_stats: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    }, {
        tableName: 'user_data',
        timestamps: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['guild_id'] },
            { fields: ['dnd_room_id'] }
        ]
    });
};