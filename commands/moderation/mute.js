const { Command } = require('commando');
const Redis = require('../../structures/Redis');
const Case = require('../../structures/Moderation');

module.exports = class MuteUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mute',
            group: 'moderation',
            memberName: 'mute',
            description: 'Mutes a user.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to mute?\n',
                    type: 'member'
                }
            ]
        });
    }

    async run(msg, args) {
        const member = args.member;
        const user = member.user;
        if (msg.author.id === user.id) return await msg.channel.send('How disgusting.');
        if (!msg.channel.permissionsFor(this.client.user).has('MANAGE_ROLES')) return msg.reply('I do not have the `manage roles` permission.');
        if (msg.client.funcs.isStaff(member) === true || user.bot) return await msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        const settings = await Redis.db.getAsync(`mute${msg.guild.id}`).then(JSON.parse) || [];
        if (settings.includes(member.id)) return msg.say(`The user ${member.id} is already muted.`);
        if (!msg.guild.roles.find(role => role.name === 'Muted')) await msg.guild.roles.create({
            data: {
                name: 'Muted'
            },
            reason: 'Muted role automatically generated.'
        }).then(() => msg.reply('A role `Muted` has been created. Make sure it\'s sorted correctly (ideally at the top)!'));


        await Case.postHistory(member.user, msg.channel);
        await msg.say('__**Please review the above information...**__\nIf this user should still be muted, **enter the reason now or type cancel to quit...**');

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

        await msg.say(`Please enter the amount of time in MINUTES to mute this user...`);
        responded = false;
        let mute;
        while (!responded) {
            const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
                max: 1,
                time: 60 * 1000
            });

            if (!responses || responses.size !== 1) {
                return msg.say('Command cancelled');
            }

            mute = responses.first();
            if (isNaN(mute.content) || mute.content < 0) await msg.say(stripIndents`**Unknown response.**\nPlease enter a number between greater than 0...**`);
            else responded = true;
        }

        settings.push(member.id);
        await Redis.db.setAsync(`mute${msg.guild.id}`, JSON.stringify(settings)).catch(console.error);
        await member.roles.add(msg.guild.roles.find(role => role.name === 'Muted'));
        const mod = new Case(msg.author, member.user, msg.guild, reason.content, screenshot.content, 'mute', mute.content, 0);
        await mod.postCase();
        Redis.db.setAsync(`muted${user.id}`, ' ');
        Redis.db.expire(`muted${user.id}`, mute.content * 60);
        Redis.db.ttl(`muted${user.id}`, (err, ttl) => {
            if (err) console.error(err);
            setTimeout(() => this.client.registry.resolveCommand('moderation:unmute').run(msg, { member: member }), Math.max(0, ttl * 1000));
        });

        const dm = await args.member.createDM();
        await dm.send(`You've been muted in ${msg.guild.name}.\n\`Reason:\` ${reason.content}\nLength:${mute.content} minutes\nRead #rules-and-information to avoid getting in anymore trouble!`)
            .catch(error => msg.reply(`This User has DM's disabled! ${error}`));
        await msg.channel.send(`${args.member} **Anta Baka!?**`);
    }
};