const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class BamUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bam',
            group: 'administration',
            memberName: 'bam',
            description: 'Permanently bam a user from the server.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to swing the hammer down upon?\n',
                    type: 'member'
                }

            ]
        });
    }

    hasPermission(msg) {
        return msg.client.funcs.isStaff(msg.member);
    }

    async run(msg, args) { // eslint-disable-line consistent-return
        const user = args.member.user;
        if (msg.author.id === user.id) return await msg.channel.send('How disgusting.');
        return msg.channel.send(`${args.member} **Anta Baka!?**`);
    }
};