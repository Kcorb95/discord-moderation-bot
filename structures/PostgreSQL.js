const Sequelize = require('sequelize');
const { DATABASE_URL } = require('../settings.json');
const database = new Sequelize(DATABASE_URL, { logging: false });
const Logger = require('./Logger');

class Database {
    static get db() {
        return database;
    }

    static start() {
        database.authenticate()
            .then(() => Logger.info('[POSTGRES]: Connection to database has been established successfully.'))
            .then(() => Logger.info('[POSTGRES]: Synchronizing database...'))
            .then(() => database.sync()
                .then(() => Logger.info('[POSTGRES]: Done Synchronizing database!'))
                .catch(error => Logger.error(`[POSTGRES]: Error synchronizing the database: \n${error}`)))
            .catch(error => {
                Logger.error(`[POSTGRES]: Unable to connect to the database: \n${error}`);
                Logger.error(`[POSTGRES]: Try reconnecting in 5 seconds...`);
                setTimeout(() => Database.start(), 5000);
            });
    }
}

module.exports = Database;