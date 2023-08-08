const { Command } = require('commando');
const { stripIndents } = require('common-tags');
const ModLogs = require('../../models/ModLogs');
const moment = require('moment');

module.exports = class UserInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'modactions',
            aliases: ['actions'],
            group: 'moderation',
            memberName: 'modactions',
            description: 'Get a moderator\'s actions from the past X amount of days.',
            args: [
                {
                    key: 'member',
                    prompt: 'what user would you like to have information on?\n',
                    type: 'member'
                },
                {
                    key: 'days',
                    prompt: 'how many days do you want to track?\n',
                    type: 'integer'
                }
            ]
        });
    }

    async run(msg, { member, days }) {
        const date = await moment().subtract(days, 'd');

        const warnings = await fetchType('warning');
        const strikes = await fetchType('strike');
        const mutes = await fetchType('mute');
        const softbans = await fetchType('softban');
        const kicks = await fetchType('kick');
        const bans = await fetchType('ban');
        const deletions = await fetchDeletions();

        let embed = await new this.client.methods.Embed()
            .setAuthor(`${member.user.username}#${member.user.discriminator} (${member.user.id})`, member.user.displayAvatarURL())
            .setColor(3447003)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp(new Date())
            .setFooter(this.client.user.username, this.client.user.displayAvatarURL())
            .addField(`Warnings`, warnings)
            .addField(`Strikes`, strikes)
            .addField(`Mutes`, mutes)
            .addField(`Softbans`, softbans)
            .addField(`Kicks`, kicks)
            .addField(`Bans`, bans)
            .addField(`Deletions`, deletions);

        msg.channel.send(embed);

        async function fetchType(type) {
            return await ModLogs.count({
                where: {
                    mod: member.id,
                    guildID: member.guild.id,
                    type: type,
                    createdAt: { $gte: date }
                }
            }) || 0;
        }

        async function fetchDeletions() {
            let logs = await msg.guild.fetchAuditLogs({ limit: 100, type: 'MESSAGE_DELETE' });
            let entries = logs.entries;
            let filteredEntries = await entries.filter(entry => {
                return entry.executor.id === member.id && entry.createdAt >= date;
            });

            let deleteCount = 0;
            await filteredEntries.map(entry => {
                deleteCount += Math.floor(entry.extra.count);
            });
            return deleteCount;
        }
    }
};
