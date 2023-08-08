const guildSettings = require('../models/GuildSettings');
const moment = require('moment');

exports.run = async (bot, member) => {
    const settings = await guildSettings.findOne({ where: { guildID: member.guild.id } });
    if (!settings || !settings.eventLoggingChannel) return;
    const embed = new bot.methods.Embed()
        .setAuthor(`User Left: ${member.user.username}#${member.user.discriminator} (${member.user.id})`, member.user.displayAvatarURL())//command author's info
        .setColor('#ba671a')
        .addField('Username:', `${member.user}`)
        .addField('Account Created:', `${moment(member.user.createdAt).format('LLLL')}${member.user.bot
            ? '\n• Is a bot account'
            : ''}`)
        .addField('Joined:', moment(member.joinedAt).format('LLLL'))
        .setTimestamp();//current date/time
    member.guild.channels.get(settings.eventLoggingChannel).send({ embed });
};