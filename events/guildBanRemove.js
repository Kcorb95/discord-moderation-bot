const guildSettings = require('../models/GuildSettings');

exports.run = async (bot, guild, user) => {
    const settings = await guildSettings.findOne({ where: { guildID: guild.id } });
    if (!settings || !settings.eventLoggingChannel) return;
    const embed = new bot.methods.Embed()
        .setAuthor(`User UnBanned: ${user.username}#${user.discriminator} (${user.id})`, user.displayAvatarURL())//command author's info
        .setColor('#723b82')
        .addField('User:', `${user}`)
        .setTimestamp();//current date/time
    guild.channels.get(settings.eventLoggingChannel).send({ embed });
};