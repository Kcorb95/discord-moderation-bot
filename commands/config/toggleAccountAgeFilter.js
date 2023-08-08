const { Command } = require('commando');
const guildSettings = require('../../models/GuildSettings');
const Redis = require('../../structures/Redis');

module.exports = class ToggleAccountAgeFilterCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'toggleaccountagefilter',
            aliases: ['taaf'],
            group: 'config',
            memberName: 'toggleaccountagefilter',
            description: 'Enables or disables the Account Age Filter.',
            guildOnly: true,
            examples: [
                'aaf true'
            ],
            args: [
                {
                    key: 'enabled',
                    prompt: `Would you like to enable or disable the filter?`,
                    type: 'boolean'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.author.id === this.client.options.owner;
    }

    async run(msg, args) {
        const settings = await guildSettings.findOne({ where: { guildID: msg.guild.id } }) || await guildSettings.create({ guildID: msg.guild.id });
        let accountAgeFilter = settings.accountAgeFilter;
        accountAgeFilter.enabled = args.enabled;
        settings.accountAgeFilter = accountAgeFilter;
        await Redis.db.setAsync(`accountAgeFilter${msg.guild.id}`, JSON.stringify(accountAgeFilter.enabled)).catch(console.error);
        await settings.save().catch(console.error);
        return msg.reply(`The Account Age Filter has been ${args.enabled ? 'enabled' : 'disabled'}.`);
    }
};