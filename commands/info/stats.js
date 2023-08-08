const { Command } = require('commando');
const moment = require('moment');
require('moment-duration-format');
const config = require('../../settings');

module.exports = class StatsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stats',
            group: 'info',
            memberName: 'stats',
            description: 'Get info about the bot.',
            details: `Provides some information about the bot such as uptime and server count.`,
            guildOnly: false
        });
    }

    async run(msg) {
        const embed = await new this.client.methods.Embed()
            .addField('❯ Creator', `${this.client.users.get(config.owner).username}#${this.client.users.get(config.owner).discriminator}`)
            .addField('❯ Memory Usage', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
            .addField('❯ Swap Size', `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`, true)
            .addField('❯ Bot Uptime', moment.duration(this.client.uptime).format(' D [days], H [hrs], m [mins], s [secs]'), true)
            .addField('❯ Total Servers', this.client.guilds.size, true)
            .addField('❯ Other Info', `Javascript (Node JS)\nHost: ME`, true);
        return msg.embed(embed);
    }
};