const GuildSettings = require('../models/GuildSettings');

const Logger = require('../structures/Logger');

module.exports = async client => {
    const guilds = await client.guilds;
    Logger.info(`Loading ${guilds.size} guilds.....`);
    for (const guild of guilds) {
        await syncSettings(guild[1]);
    }
    Logger.info(`Done loading guilds!`);

    async function syncSettings(guild) {
        const settings = await GuildSettings.findOne({ where: { guildID: guild.id } });
        if (!settings)
            await GuildSettings.create({ guildID: guild.id });
    }
};