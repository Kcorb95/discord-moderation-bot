const { Command } = require('commando');
const guildSettings = require('../../models/GuildSettings');

module.exports = class HelpChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'sethelpchannel',
            group: 'config',
            aliases: ['sethelp', 'helpchannel'],
            memberName: 'sethelpchannel',
            description: 'Sets the channel for user tickets.',
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

    async run(msg, args) {
        const settings = await guildSettings.findOne({ where: { guildID: msg.guild.id } }) || await guildSettings.create({ guildID: msg.guild.id });
        settings.helpChannel = args.channel.id;
        await settings.save().catch(console.error);
        return msg.reply(`I have successfully set ${args.channel} as the destination channel for mod help.`);
    }
};