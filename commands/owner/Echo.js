const { Command } = require('commando');

module.exports = class EchoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'echo',
            group: 'owner',
            memberName: 'echo',
            description: 'Echos text back',
            details: `Echos text back`,
            guildOnly: true,
            ownerOnly: true,
            args: [
                {
                    key: 'text',
                    prompt: 'what text should be echoed?\n',
                    type: 'string'
                }
            ]
        });
    }

    async run(msg, { text }) {
        msg.channel.send(text);
    }
};