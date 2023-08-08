const { Command } = require('commando');
const guildSettings = require('../../models/GuildSettings');

module.exports = class AccountAgeFilterCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'accountagefilter',
            aliases: ['aaf'],
            group: 'config',
            memberName: 'accountagefilter',
            description: 'Sets the account age filter threshold.',
            guildOnly: true,
            args: [
                {
                    key: 'days',
                    prompt: 'How old in days must the account be?\n',
                    type: 'integer'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.author.id === this.client.options.owner;
    }

    async run(msg, args) {
        const settings = await guildSettings.findOne({ where: { guildID: msg.guild.id } }) || await guildSettings.create({ guildID: msg.guild.id });
        const accountAgeFilter = settings.accountAgeFilter;
        accountAgeFilter.days = args.days;
        settings.accountAgeFilter = accountAgeFilter;
        await settings.save().catch(console.error);
        return msg.reply(`I have successfully set ${args.days} as the filter threshold.`);
    }
};