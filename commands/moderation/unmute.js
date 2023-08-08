const { stripIndents } = require('common-tags');
const { Command } = require('commando');
const GuildSettings = require('../../models/GuildSettings');
const Redis = require('../../structures/Redis');

module.exports = class UnMuteUserCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'unmute',
            group: 'moderation',
            memberName: 'unmute',
            description: 'Unmutes a user.',
            guildOnly: true,
            args: [
                {
                    key: 'member',
                    prompt: 'What user would you like to unmute?\n',
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
        const guildSettings = await GuildSettings.findOne({ where: { guildID: msg.guild.id } }) || await GuildSettings.create({ guildID: msg.guild.id });
        const channel = msg.guild.channels.get(guildSettings.moderationLoggingChannel);
        if (!channel) return msg.reply('There is no channel for ModLogs set.');
        const settings = await Redis.db.getAsync(`mute${msg.guild.id}`).then(JSON.parse) || [];
        if (!settings.includes(member.id)) return msg.say(`The user ${member.user.username} isn't muted!`);
        if (!msg.guild.roles.find(role => role.name === 'Muted')) await msg.guild.roles.create({
            data: {
                name: 'Muted'
            },
            reason: 'Muted role automatically generated.'
        }).then(() => msg.reply('A role `Muted` has been created. Make sure it\'s sorted correctly (ideally at the top)!'));

        settings.splice(settings.indexOf(member.id), 1);
        await Redis.db.setAsync(`mute${msg.guild.id}`, JSON.stringify(settings)).catch(console.error);
        await member.roles.remove(msg.guild.roles.find(role => role.name === 'Muted'));

        const embed = new this.client.methods.Embed()
            .setColor('#9BC1BF')
            .setAuthor(`${msg.member.displayName}#${msg.author.discriminator}`, msg.author.displayAvatarURL)
            .setDescription(stripIndents`
			    **User**: ${msg.member} -- ${member.displayName}#${user.discriminator} (${member.id})
			    **Action**: unmute`)
            .setFooter(`User Unmuted`, msg.guild.client.user.displayAvatarURL)
            .setTimestamp();

        await channel.send({ embed });

        Redis.db.del(`muted${user.id}`);
        const dm = await args.member.createDM();
        await dm.send(`You've un-muted in ${msg.guild.name}.\n\`**READ THE RULES TO AVOID ANY MORE TROUBLE**`)
            .catch(error => msg.reply(`This User has DM's disabled! ${error}`));
        return msg.reply(`I have successfully unmuted ${user.username}.`);
    }
};