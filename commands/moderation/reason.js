const { Command } = require('commando');
const Case = require('../../structures/Moderation');
const guildSettings = require('../../models/GuildSettings');

module.exports = class ReasonCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reason',
            group: 'moderation',
            memberName: 'reason',
            description: 'Updates a case.',
            guildOnly: true,
            args: [
                {
                    key: 'case',
                    prompt: 'What case would you like to modify? Specify `latest` to modify the most recent case.\n',
                    type: 'string',
                    validate: (str) => {
                        return str === 'latest' || parseInt(str);
                    },
                    parse: (str) => {
                        return str === 'latest' ? 'latest' : parseInt(str);
                    }
                },
                {
                    key: 'reason',
                    prompt: 'What should the new reason be?\n',
                    type: 'string',
                    validate: (str) => {
                        if (str.length > 1024) return 'The specified reason is far too long, please try again with a maximum of 1024 characters.';
                        return true;
                    }
                }
            ]
        });
    }

    async run(msg, args) {
        const settings = await guildSettings.findOne({ where: { guildID: msg.guild.id } }) || await guildSettings.create({ guildID: msg.guild.id });
        const channel = msg.guild.channels.get(settings.moderationLoggingChannel);
        if (!channel) return msg.reply('There is no channel for ModLogs set.');

        let message = await msg.channel.send('Updating case...');
        const caseToEdit = args.case === 'latest' ? Case.getLastCase(msg.guild.id) : Case.getCase(msg.guild.id, args.case);
        if (!caseToEdit) return message.edit('could not find a case with the specified index.');

        const caseMessage = await channel.messages.fetch(caseToEdit.caseMessageID);
        const regex = /\*\*Reason\*\*: (.*)/;
        const newDesc = caseMessage.embeds[0].description.replace(caseMessage.embeds[0].description.match(regex)[1], args.reason);
        const footer = caseMessage.embeds[0].footer.text;
        const color = caseMessage.embeds[0].color;
        const image = caseMessage.embeds[0].image;

        const embed = new this.client.methods.Embed()
            .setColor(color)
            .setAuthor(`${msg.author.username}#${msg.author.discriminator}`, msg.author.displayAvatarURL())
            .setDescription(newDesc);
        if (image !== null) {
            embed.setImage(image.url);
            embed.setURL(image.url)
        }
        embed.setFooter(footer, msg.guild.client.user.displayAvatarURL())
            .setTimestamp();

        caseMessage.edit('', { embed });

        Case.updateCaseReason(caseToEdit.globalCaseCount, msg.guild.id, args.reason);

        return message.edit(`Successfully updated fuck-up: ${args.case}.`);
    }
};