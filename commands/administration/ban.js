const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class BanUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ban',
            group: 'administration',
            memberName: 'ban',
            description: 'Permanently ban a user from the server.',
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
        if (msg.member.id === '134349083568504832' && user.id === '269983920211230723') return await msg.channel.send('uwu ban me daddy');
        if (msg.member.id === '134349083568504832' && user.id === '134349083568504832') return await msg.channel.send('lewd');
        if (msg.author.id === user.id) return await msg.channel.send('How disgusting.');
        if (!msg.channel.permissionsFor(this.client.user).has('BAN_MEMBERS')) return msg.reply('I do not have the `ban members` permission.');
        const member = await msg.guild.members.fetch(user).catch(() => null);
        if (msg.client.funcs.isStaff(args.member) === true || user.bot) return await msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        await Case.postHistory(args.member.user, msg.channel);
        await msg.say('__**Please review the above information...**__\nIf this user should still be banned, **enter the reason now or type cancel to quit...**');
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

        const mod = new Case(msg.author, member.user, msg.guild, reason.content, screenshot.content, 'ban', 0, prune.content);
        await mod.postCase();

        const dm = await args.member.createDM();
        await dm.send(`You've been banned from ${msg.guild.name}!\n\`Reason:\` ${reason.content}\nIf you wish to be unbanned, you may send an appeal here: https://goo.gl/forms/g4hF0SnVcT8rBqFw2`)
            .catch(error => msg.reply(`This user has DM's disabled! ${error}`));

        await args.member.ban({
            reason: reason.content,
            days: prune.content
        }).catch(error => msg.reply(`There was an error trying to ban:\n${error}`));
        await msg.channel.send(`${args.member} **Anta Baka!?**`);
    }
};
