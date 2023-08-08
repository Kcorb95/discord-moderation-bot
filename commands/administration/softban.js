const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class BanUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'softban',
            group: 'administration',
            memberName: 'softban',
            description: 'Softbans a user.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'What user would you like to softban?\n',
                    type: 'member'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.client.funcs.isStaff(msg.member);
    }

    async run(msg, args) {
        const member = args.member;
        const user = member.user;
        if (msg.author.id === user.id) return await msg.channel.send('How disgusting.');
        if (!msg.channel.permissionsFor(this.client.user).has('BAN_MEMBERS')) return msg.reply('I do not have the `ban members` permission.');
        if (msg.client.funcs.isStaff(args.member) === true || user.bot) return await msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        await Case.postHistory(member.user, msg.channel);
        await msg.say('__**Please review the above information...**__\nIf this user should still be soft-banned, **enter the reason now or type cancel to quit...**');

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

        await msg.say(`Please enter the prune in days (up to 7 or 0 for none) for this user's messages...`);
        responded = false;
        let prune;
        while (!responded) {
            const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
                max: 1,
                time: 60 * 1000
            });

            if (!responses || responses.size !== 1) {
                return msg.say('Command cancelled');
            }

            prune = responses.first();
            if (isNaN(prune.content) || prune.content > 7 || prune.content < 0) await msg.say(stripIndents`**Unknown response.**\nPlease enter a number between 0 and 7...**`);
            else responded = true;
        }

        const mod = new Case(msg.author, member.user, msg.guild, reason.content, screenshot.content, 'softban', 0, 7);
        await mod.postCase();

        const dm = await args.member.createDM();
        await dm.send(`You've been soft banned from ${msg.guild.name}!\n\`Reason:\` ${reason.content}`)
            .catch(error => msg.reply(`This User has DM's disabled! ${error}`));
        await member.ban(reason.content, 7);
        await msg.guild.members.unban(user);
        await msg.channel.send(`${args.member} **Anta Baka!?**`);
    }
};