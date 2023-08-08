const { Command } = require('commando');
const GuildSettings = require('../../models/GuildSettings');

module.exports = class SetActivityCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'raidcounter',
            group: 'owner',
            aliases: ['raidcount'],
            memberName: 'raidcounter',
            description: 'Increases and shows the current raid count',
            details: `Increases and shows the current raid count`,
            guildOnly: true,
            ownerOnly: true
        });
    }

    async run(msg) {
        const settings = await GuildSettings.findOne({ where: { guildID: msg.guild.id } }) || await GuildSettings.create({ guildID: msg.guild.id });
        settings.raidCounter++;
        await settings.save();
        return msg.channel.send(`${settings.raidCounter} raids stopped and counting. Is that all you got?`);
    }
};