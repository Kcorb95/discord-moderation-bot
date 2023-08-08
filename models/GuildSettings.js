const { DataTypes, Model } = require('sequelize');
const Database = require('../structures/PostgreSQL');

class GuildSettings extends Model {
}

GuildSettings.init({
    guildID: DataTypes.STRING,
    moderationLoggingChannel: DataTypes.STRING,
    eventLoggingChannel: DataTypes.STRING,
    helpChannel: DataTypes.STRING,
    raidCounter: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    accountAgeFilter: {
        type: DataTypes.JSONB(),
        defaultValue: {}
    },
    bannedWords: DataTypes.ARRAY(DataTypes.STRING)
}, { sequelize: Database.db });

module.exports = GuildSettings;