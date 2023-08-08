const { Command } = require('commando');
module.exports = class AnnounceCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'announce',
            aliases: ['say', 'send'],
            group: 'owner',
            memberName: 'announce',
            description: 'Makes Asuka echo a message to a specified channel',
            details: `Makes Asuka echo a message to a specified channel`,
            guildOnly: true,
            ownerOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: 'what channel should this be sent to?\n',
                    type: 'channel'
                },
                {
                    key: 'text',
                    prompt: 'what text should be echoed?\n',
                    type: 'string'
                }
            ]
        });
    }

    async run(msg, args) {
        msg.guild.channels.get(args.channel.id).send(args.text);
    }
};