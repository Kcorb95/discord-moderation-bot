const guildSettings = require('../models/GuildSettings');

exports.run = async (bot, role) => {
    const settings = await guildSettings.findOne({ where: { guildID: role.guild.id } });
    if (!settings) return;
    const embed = new bot.methods.Embed()
        .setColor('#82723b')
        .addField('Role Deleted:', `${role.name} (${role.id})`)
        .setTimestamp();//current date/time
    role.guild.channels.get(settings.eventLoggingChannel).send({ embed });
};