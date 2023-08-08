const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class WarnUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'warn',
            group: 'moderation',
            memberName: 'warn',
            description: 'Warn a user that they dun fucked up',
            details: `Warn a user that they dun fucked up`,
            guildOnly: true,
            whitelist: { role: true },
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to warn?',
                    type: 'member'
                }
            ]
        });
    }

    async run(msg, { member }) {
        if (msg.author.id === member.user.id) return await msg.channel.send('How disgusting.');
        if (msg.client.funcs.isStaff(member) === true || member.user.bot) return await msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        await Case.postHistory(member.user, msg.channel);
        await msg.say('__**Please review the above information...**__\nIf this user should still be warned, **enter the reason now or type cancel to quit...**');

        let reason;
        let responded;
        while (!responded) {
            const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
                max: 1,
                time: 60 * 1000
            });

            if (!responses || responses.size !== 1) {
                return msg.say('Command cancelled');
            }

            reason = responses.first();

            if (reason.content.toLowerCase() === 'cancel' || reason.content.toLowerCase() === 'quit' || reason.content.toLowerCase() === 'abort') return msg.say('Command Cancelled.');
            else responded = true;
        }

        await msg.say(`Please upload a screenshot of the complete conversation between you and this user to \<\https://imgur.com\>\ and then post the link here or type 'skip' to skip...`);
        responded = false;
        let screenshot;
        while (!responded) {
            const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
                max: 1,
                time: 60 * 1000
            });

            if (!responses || responses.size !== 1) {
                return msg.say('Command cancelled');
            }

            screenshot = responses.first();
            responded = true;
        }

        if (screenshot.attachments.array().length > 0) screenshot.content = screenshot.attachments.first().url;

        const mod = new Case(msg.author, member.user, msg.guild, reason.content, screenshot.content, 'warning', 0, 0);
        await mod.postCase();

        // const dm = await args.member.createDM();
        // await dm.send(`You've received a warning in ${msg.guild.name}.\n\`Reason:\` ${args.reason}`)
        //     .catch(error => msg.reply(`This User has DM's disabled! ${error}`));
        return msg.channel.send(`${member} **Anta Baka!?**`);
    }
};