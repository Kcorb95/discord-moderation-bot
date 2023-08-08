const { Command } = require('commando');
const Case = require('../../structures/Moderation');

module.exports = class KickUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'kick',
            group: 'administration',
            memberName: 'kick',
            description: 'Kick a user from the server.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to give the boot?\n',
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
        if (!msg.channel.permissionsFor(this.client.user).has('KICK_MEMBERS')) return msg.reply('I do not have the `kick members` permission.');
        const member = await msg.guild.members.fetch(user).catch(() => null);
        if (msg.client.funcs.isStaff(args.member) === true || user.bot) return await msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        await Case.postHistory(member.user, msg.channel);
        await msg.say('__**Please review the above information...**__\nIf this user should still be kicked, **enter the reason now or type cancel to quit...**');

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

        const mod = new Case(msg.author, member.user, msg.guild, reason.content, screenshot.content, 'kick', 0, 0);
        await mod.postCase();
        const dm = await member.createDM();
        await dm.send(`You've been kicked from ${msg.guild.name}!\n\`Reason:\` ${reason.content}`)
            .catch(error => msg.reply(`This user has DM's disabled! ${error}`));
        await member.kick(reason.content).catch(error => msg.reply(`There was an error trying to kick: ${error}`));
        await msg.channel.send(`${member} **Anta Baka!?**`);
    }
};