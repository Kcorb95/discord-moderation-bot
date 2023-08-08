const { Command } = require('commando');
const moment = require('moment');

module.exports = class UserInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'info',
            aliases: ['user', 'user-info'],
            group: 'info',
            memberName: 'info',
            description: 'Get info on a user.',
            details: `Get detailed information on the specified user.`,
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3
            },
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to have information on?\n',
                    type: 'member'
                }
            ]
        });
    }

    async run(msg, args) {
        const member = args.member;
        const user = member.user;
        const embed = await new this.client.methods.Embed()
            .setAuthor(`${user.username}#${user.discriminator} (${user.id})`, user.displayAvatarURL)
            .setThumbnail(user.displayAvatarURL)
            .setFooter(this.client.user.username, this.client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setColor(3447003)
            .addField('ID', user.id, true)
            .addField('Status', user.presence.status, true)
            .addField('Account Created', `${moment.utc(user.createdAt).format('LLLL')}${user.bot
                ? '\n• Is a bot account'
                : ''}`)
            .addField('Join Date', moment.utc(member.joinedAt).format('LLLL'))
            .addField(`Roles [${member.roles.size}]`, member.roles.map(roles => `\`${roles.name}\``).join(' **--** '))
            .addField(`Nickname`, `${member.nickname !== null ? ` • Nickname: ${member.nickname}` : '• No nickname'}`, true)
            .addField(`Playing`, `${user.presence.game ? user.presence.game.name : 'None'}`, true);
        return msg.embed(embed);
    }
};