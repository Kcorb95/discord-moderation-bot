const guildSettings = require('../models/GuildSettings');

exports.run = async (bot, oldRole, newRole) => {
    const settings = await guildSettings.findOne({ where: { guildID: newRole.guild.id } });
    if (!settings || !settings.eventLoggingChannel) return;
    if (oldRole.name === 'new role') {
        const embed = new bot.methods.Embed()
            .setColor('#3b826e')
            .addField('Role Created:', `${newRole.name} (${newRole.id})`)
            .setTimestamp(); // current date/time
        newRole.guild.channels.get(settings.eventLoggingChannel).send({ embed });
    } else if (oldRole.name !== newRole.name) {
        const embed = new bot.methods.Embed()
            .setColor('#696969')
            .addField('Role Name Changed:', `**Old Name:** ${oldRole.name}\n**New Name:** ${newRole.name}`)
            .setTimestamp();
        newRole.guild.channels.get(settings.eventLoggingChannel).send({ embed });
    }
};