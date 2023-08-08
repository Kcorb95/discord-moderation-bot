const { Command } = require('commando');
const Redis = require('../../structures/Redis');
const Case = require('../../structures/Moderation');

module.exports = class MuteUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'quickmute',
            group: 'moderation',
            memberName: 'quickmute',
            description: 'Quickly mutes a user.',
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

    async run(msg, { member }) {
        if (msg.author.id === member.user.id) return msg.channel.send('How disgusting.');
        if (!msg.channel.permissionsFor(this.client.user).has('MANAGE_ROLES')) return msg.reply('I do not have the `manage roles` permission.');
        if (msg.client.funcs.isStaff(member) === true || member.user.bot) return msg.channel.send('YOU HAVE NO POWER HERE!! :rofl:');

        const settings = await Redis.db.getAsync(`mute${msg.guild.id}`).then(JSON.parse) || [];
        if (settings.includes(member.id)) return msg.say(`The user ${member.id} is already muted.`);
        if (!msg.guild.roles.find(role => role.name === 'Muted')) await msg.guild.roles.create({
            data: {
                name: 'Muted'
            },
            reason: 'Muted role automatically generated.'
        }).then(() => msg.reply('A role `Muted` has been created. Make sure it\'s sorted correctly (ideally at the top)!'));

        settings.push(member.id);
        await Redis.db.setAsync(`mute${msg.guild.id}`, JSON.stringify(settings)).catch(console.error);
        await member.roles.add(msg.guild.roles.find(role => role.name === 'Muted'));
        const mod = new Case(msg.author, member.user, msg.guild, 'QUICK MUTE', '', 'mute', 5, 0);
        await mod.postCase();
        Redis.db.setAsync(`muted${member.id}`, ' ');
        Redis.db.expire(`muted${member.id}`, 5 * 60);
        Redis.db.ttl(`muted${member.id}`, (err, ttl) => {
            if (err) console.error(err);
            setTimeout(() => this.client.registry.resolveCommand('moderation:unmute').run(msg, { member: member }), Math.max(0, ttl * 1000));
        });
        await msg.channel.send(`${member} **Anta Baka!?**`);
    }
};