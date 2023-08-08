const { DataTypes, Model } = require('sequelize');
const Database = require('../structures/PostgreSQL');

class ModLogs extends Model {
}

ModLogs.init({
    guildID: DataTypes.BIGINT,
    userID: DataTypes.BIGINT,
    globalCaseCount: {
        type: DataTypes.INTEGER
    },
    type: DataTypes.STRING,
    reason: DataTypes.STRING(2000),
    screenshot: DataTypes.STRING,
    caseCount: DataTypes.INTEGER,
    mod: DataTypes.BIGINT,
    caseMessageID: DataTypes.BIGINT,
    mute: DataTypes.INTEGER,
    prune: DataTypes.INTEGER
}, { sequelize: Database.db });

ModLogs.cases = [];
ModLogs.warnings = [];
ModLogs.strikes = [];
ModLogs.mutes = [];
ModLogs.kicks = [];
ModLogs.softbans = [];
ModLogs.bans = [];

module.exports = ModLogs;