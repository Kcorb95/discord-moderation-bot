const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class TimeoutCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'timeout',
            group: 'moderation',
            memberName: 'timeout',
            description: 'Times a user out from a channel.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'What is the user that you wish to timeout?\n',
                    type: 'member'
                },
                {
                    key: 'channel',
                    prompt: 'What channel should they be timed out in?\n',
                    type: 'channel'
                },
                {
                    key: 'time',
                    prompt: 'How many minutes?\n',
                    type: 'string'
                }
            ]
        });
    }

    async run(msg, { member, channel, time }) {
        if (msg.author.id === member.user.id) return msg.channel.send('How disgusting.');
        if (!msg.channel.permissionsFor(this.client.user).has('MANAGE_ROLES')) return msg.reply('I do not have the `manage roles` permission.');
        if (msg.client.funcs.isStaff(member) === true || member.user.bot) return msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        await channel.updateOverwrite(member, {
            'SEND_MESSAGES': false,
            'ADD_REACTIONS': false
        }, `TIMED-OUT -- ${msg.member.displayName}`);
        // May need this for KICK on 2B
        const removeTimeout = async () => {
            await channel.permissionOverwrites.map(overwrites => {
                if (overwrites.id === member.id) overwrites.delete();
            });
        };
        setTimeout(() => removeTimeout(), time * 60 * 1000);

        const mod = new Case(msg.author, member.user, msg.guild, `TIMEDOUT - ${channel.name}`, '', 'mute', time, 0);
        await mod.postCase();
        await msg.channel.send(`${member} **Anta Baka!?**`);
    }
};