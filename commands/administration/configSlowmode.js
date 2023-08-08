const { Command } = require('commando');
const GuildSettings = require('../../models/GuildSettings');

module.exports = class ConfigSlowmodeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'config-slowmode',
            group: 'administration',
            aliases: ['slowmode'],
            memberName: 'config-slowmode',
            description: 'Configures slowmode for a channel.',
            guildOnly: true,
            args: [
                {
                    key: 'rate',
                    prompt: 'ONE message per how many seconds?',
                    type: 'integer',
                    default: ''
                },
                {
                    key: 'channel',
                    prompt: 'what user would you like to swing the hammer down upon?\n',
                    type: 'channel',
                    default: ''
                }

            ]
        });
    }

    async run(msg, args) { // eslint-disable-line consistent-return
        const channel = args.channel || msg.channel;
        let rate = parseInt(args.rate || 0);
        if (rate < 0) rate = 0;
        if (rate > 30) rate = 30;

        await channel.setRateLimitPerUser(rate);

        const embed = await new this.client.methods.Embed()
            .setDescription(rate === 0 ? `**Slowmode Offline...**\nChat away! :smile:` : `**Slowmode Online...**\nYou may send ONE message every ${rate} ${rate > 1 ? 'seconds' : 'second'}`)
            .setThumbnail(`https://thumbs.gfycat.com/IndolentPoshGoitered-max-1mb.gif`)
            .setTimestamp(new Date())
            .setColor(`#f442a4`)
            .setFooter(this.client.user.username, this.client.user.displayAvatarURL());
        return msg.channel.send(embed); // Make me fancy
    }
};