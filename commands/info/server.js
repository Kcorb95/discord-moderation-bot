const { Command } = require('commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

const humanLevels = {
    0: 'None',
    1: 'Low',
    2: 'Medium',
    3: 'Must be here longer than 10 minutes',
    4: 'Must have verified phone'
};

const humanFilter = {
    0: 'Off',
    1: 'No Role',
    2: 'Everyone'
};

module.exports = class ServerInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'server',
            aliases: ['server-info'],
            group: 'info',
            memberName: 'server',
            description: 'Get info on the server.',
            details: `Get detailed information on the server.`,
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3
            }
        });
    }

    async run(msg) {
        const embed = await new this.client.methods.Embed()
            .setColor(3447003)
            .setAuthor(`${msg.guild.name} (${msg.guild.id})`, msg.guild.iconURL())
            .setThumbnail(msg.guild.iconURL())
            .addField('❯ Info', stripIndents`
                • __**Region**__: ${msg.guild.region}
                • __**Created at**__: ${moment.utc(msg.guild.createdAt).format('LLLL')}
                • __**Verification Level**__: ${humanLevels[msg.guild.verificationLevel]}
                • __**Content Filter Level**__: ${humanFilter[msg.guild.explicitContentFilter]}`)
            .addField('❯ Owner', msg.guild.owner, true)
            .addField('❯ Channels', stripIndents`
                • __**Default**__: ${msg.guild.defaultChannel}
                • __**AFK**__: ${msg.guild.afkChannelID ? `<#${msg.guild.afkChannelID}> after ${msg.guild.afkTimeout / 60}min` : 'None.'}
                • ${msg.guild.channels.filter(ch => ch.type === 'text').size} Text, ${msg.guild.channels.filter(ch => ch.type === 'voice').size} Voice`, true);
        const online = await msg.guild.presences.filter(presence => presence.status !== 'offline').size;
        const bots = await msg.guild.members.filter(member => member.user.bot).size;
        embed.addField('❯ Members', `${msg.guild.memberCount} members\n${online} online \uD83D\uDD35, ${bots} bot(s) \uD83E\uDD16`, true);
        if (msg.guild.roles.size >= 15) embed.addField('❯ Roles', msg.guild.roles.size, true);
        else embed.addField('❯ Roles', msg.guild.roles.map(role => role).join(' '), true);
        if (msg.guild.emojis.size > 25) {
            embed.addField('❯ Emojis (1)', msg.guild.emojis.map(emoji => emoji).slice(0, 25).join(' '));
            embed.addField('❯ Emojis (2)', msg.guild.emojis.map(emoji => emoji).slice(26).join(' '));
        } else {
            embed.addField('❯ Emojis', msg.guild.emojis.map(emoji => emoji).join(' '));
        }
        embed.setFooter(this.client.user.username, this.client.user.displayAvatarURL);
        embed.setTimestamp();
        return msg.channel.send({ embed });
    }
};