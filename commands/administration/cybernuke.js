const { Command } = require('commando');
const { stripIndents } = require('common-tags');
const winston = require('winston');
const GuildSettings = require('../../models/GuildSettings');

module.exports = class LaunchCybernukeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'launch-cybernuke',
            aliases: ['cybernuke', 'nuke'],
            group: 'administration',
            memberName: 'cybernuke',
            description: 'Bans all members that have joined recently, with new accounts.',
            guildOnly: true,
            args: [
                {
                    key: 'join',
                    label: 'member age',
                    prompt: 'how old (in minutes) should a member be for the cybernuke to ignore them (server join date)?',
                    type: 'float',
                    min: 0.1,
                    max: 20,
                    default: '5'
                },
                {
                    key: 'age',
                    label: 'account age',
                    prompt: 'how old (in minutes) should a member\'s account be for the cybernuke to ignore them (account age)?',
                    type: 'float',
                    min: 0.1,
                    max: 43200,
                    default: '7200'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.client.funcs.isStaff(msg.member);
    }

    async run(msg, args) {
        const statusMsg = await msg.reply('Calculating targeting parameters for cybernuke...');

        const memberCutoff = Date.now() - (args.join * 60000);
        const ageCutoff = Date.now() - (args.age * 60000);
        const members = msg.guild.members.filter(
            mem => mem.joinedTimestamp > memberCutoff && mem.user.createdTimestamp > ageCutoff
        );
        const booleanType = this.client.registry.types.get('boolean');

        await statusMsg.edit(`Cybernuke will strike ${members.size} members; proceed?`);
        let response;
        let statusMsg2;

        while (!statusMsg2) {
            const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
                maxMatches: 1,
                time: 10000
            });

            if (!responses || responses.size !== 1) {
                await msg.reply('Cybernuke cancelled.');
                return null;
            }
            response = responses.first();

            if (booleanType.validate(response.content)) {
                if (!booleanType.parse(response.content)) {
                    await response.reply('Cybernuke cancelled.');
                    return null;
                }

                statusMsg2 = await response.reply('Launching cybernuke...');
            } else {
                await response.reply(stripIndents`
					Unknown response. Please confirm the cybernuke launch with a simple "yes" or "no".
					Awaiting your input, commander...
				`);
            }
        }

        const fatalities = [];
        const survivors = [];
        const promises = [];

        for (const member of members.values()) {
            const dm = await member.createDM();
            promises.push(
                await dm.send(stripIndents`
					Sorry, but you've been automatically targetted by the cybernuke in the "${msg.guild.name}" server.
					This means that you have been banned, likely in the case of a server raid.
					Please contact them if you believe this ban to be in error.
				`).catch(winston.error)
                    .then(() => member.ban({ reason: 'CyberNuke', days: 7 }))
                    .then(() => {
                        fatalities.push(member);
                    })
                    .catch(err => {
                        winston.error(err);
                        survivors.push({
                            member: member.id,
                            error: err
                        });
                    })
                    .then(() => {
                        if (members.size <= 5) return;
                        if (promises.length % 5 === 0) {
                            statusMsg2.edit(`Launching cybernuke (${Math.round(promises.length / members.size * 100)}%)...`);
                        }
                    })
            );
        }

        await Promise.all(promises);
        const settings = await GuildSettings.findOne({ where: { guildID: msg.guild.id } }) || await GuildSettings.create({ guildID: msg.guild.id });
        settings.raidCounter++;
        await settings.save();
        await statusMsg2.edit('Cybernuke impact confirmed. Casualty report incoming...');
        await response.reply(stripIndents`
			__**Fatalities**__
			${fatalities.length > 0 ? stripIndents`
				${fatalities.length} confirmed KIA.
				${fatalities.map(fat => `**-** ${fat.displayName} (${fat.id})`).join('\n')}
			` : 'None'}
			${survivors.length > 0 ? stripIndents`
				__**Survivors**__
				${survivors.length} left standing.
				${survivors.map(srv => `**-** ${srv.member.displayName} (${srv.member.id}): \`${srv.error}\``).join('\n')}
			` : ''}
		`, { split: true });

        return null;
    }
};
