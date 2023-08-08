const { Command } = require('commando');
const guildSettings = require('../../models/GuildSettings');

module.exports = class ModlogsChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'modlog',
            group: 'config',
            aliases: ['setmodlog', 'setlog'],
            memberName: 'modlog',
            description: 'Sets the channel for modLogs.',
            guildOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: 'What channel would you like to set?\n',
                    type: 'channel'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.author.id === this.client.options.owner;
    }

    async run(msg, { channel }) {
        const settings = await guildSettings.findOne({ where: { guildID: msg.guild.id } }) || await guildSettings.create({ guildID: msg.guild.id });
        let modlogs = settings.modActionChannel;
        modlogs = channel.id;
        settings.moderationLoggingChannel = modlogs;
        await settings.save().catch(console.error);
        return msg.reply(`I have successfully set ${channel} as the destination channel for modlogs.`);
    }
};