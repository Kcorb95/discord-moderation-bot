const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class ViewHistoryCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'offenses',
            aliases: ['warnings', 'infractions', 'punishments', 'fuckups', 'fuck-ups', 'warns', '$$'],
            group: 'moderation',
            memberName: 'offenses',
            description: 'Views a history of the user\'s infractions.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'What user would you like to view the warnings of?\n',
                    type: 'member'
                }
            ]
        });
    }

    async run(msg, { member }) {
        return Case.postHistory(member.user, msg.channel);
    }
};