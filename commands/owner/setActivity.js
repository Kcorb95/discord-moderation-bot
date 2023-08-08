const { Command } = require('commando');

module.exports = class SetActivityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setactivity',
            group: 'owner',
            memberName: 'setactivity',
            description: 'Changes or removes the playing status of the bot',
            details: `Changes or removes the playing status of the bot`,
            examples: [`${client.commandPrefix}setactivity with fire`, `${client.commandPrefix}setactivity`],
            guildOnly: true,
            ownerOnly: true,
            args: [
                {
                    key: 'text',
                    prompt: 'What new activity would you want it to be?\n',
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    async run(msg, { text }) {
        this.client.user.setActivity(text);
    }
};