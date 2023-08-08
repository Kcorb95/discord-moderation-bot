const { Command } = require('commando');
const { stripIndents } = require('common-tags');

module.exports = class LockdownCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'lockdown',
            group: 'administration',
            memberName: 'lockdown',
            description: 'Locks down the current channel or removes a lockdown, which prevents non-administrator members from speaking.',
            guildOnly: true,
            args: [
                {
                    key: 'type',
                    prompt: 'Please enter either `start` or `stop`.',
                    type: 'string',
                    validate: type => {
                        if (['start', 'stop'].includes(type.toLowerCase())) return true;
                        return 'Please enter either `start` or `stop`.';
                    },
                    parse: type => type.toLowerCase()
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.client.funcs.isStaff(msg.member);
    }

    async run(msg, args) {
        const { type } = args;
        if (type === 'start') {
            try {
                await msg.channel.updateOverwrite(msg.guild.defaultRole, {
                    'SEND_MESSAGES': false
                }, `LOCKDOWN -- ${msg.member.displayName}`);
                return msg.say(stripIndents`
                    Lockdown Started, users without Administrator can no longer post messages.
                    Please use \`lockdown stop\` to end the lockdown.
                `);
            } catch (err) {
                return this.client.logger.error(`An Error Occurred: ${err}`);
            }
        } else if (type === 'stop') {
            try {
                await msg.channel.updateOverwrite(msg.guild.defaultRole, {
                    'SEND_MESSAGES': null
                }, `LOCKDOWN ENDED -- ${msg.member.displayName}`);
                return msg.say('Lockdown Ended, users without Administrator can now post messages.');
            } catch (err) {
                return this.client.logger.error(`An Error Occurred: ${err}`);
            }
        }
    }
};