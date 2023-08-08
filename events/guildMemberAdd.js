const guildSettings = require('../models/GuildSettings');
const moment = require('moment');

exports.run = async (bot, member) => {
    const settings = await guildSettings.findOne({ where: { guildID: member.guild.id } });
    if (!settings || !settings.eventLoggingChannel) return;
    const accountAgeFilter = settings.accountAgeFilter;

    const embed = new bot.methods.Embed()
        .setAuthor(`User Joined: ${member.user.username}#${member.user.discriminator} (${member.user.id})`, member.user.displayAvatarURL())//command author's info
        .setColor('#2c7241')
        .addField('Username:', `${member.user}`)
        .addField('Account Created:', `${moment(member.user.createdAt).format('LLLL')}${member.user.bot
            ? '\n• Is a bot account'
            : ''}`)
        .setTimestamp();//current date/time
    await member.guild.channels.get(settings.eventLoggingChannel).send({ embed }).catch(console.error);

    if (!accountAgeFilter.enabled) return;
    const created = await member.user.createdAt;
    const date = new Date();
    const timeDiff = Math.abs(date.getTime() - created.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (diffDays <= settings.accountAgeFilter.days) {
        const dm = await member.createDM();
        await dm.send(`This server uses Automated Account Protection. You have been auto-banned from **${member.guild.name}**. If you believe this to be an error, **PLEASE CONTACT ${member.guild.owner}**`);
        await member.ban(0);
    }
};