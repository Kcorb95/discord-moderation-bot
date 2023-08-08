const { Command } = require('commando');
const GuildSettings = require('../../models/GuildSettings');

module.exports = class RemoveFilteredWordCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'remove-filtered-word',
            group: 'config',
            aliases: ['rfw', 'removeword', 'deleteword'],
            memberName: 'remove-filtered-word',
            description: 'Removes a word from the list of filtered words.',
            guildOnly: true,
            ownerOnly: true,
            args: [
                {
                    key: 'word',
                    prompt: 'What word would you like to filter?\n',
                    type: 'string'
                }
            ]
        });
    }

    hasPermission(msg) {
        return msg.author.id === this.client.options.owner;
    }
    
    async run(msg, args) {
        const word = args.word.toLowerCase();
        const settings = await GuildSettings.findOne({ where: { guildID: msg.guild.id } }) || await GuildSettings.create({ guildID: msg.guild.id });
        let bannedWords = settings.bannedWords;
        if (!bannedWords || bannedWords.length === 0) return null;
        const index = bannedWords.indexOf(word);
        if (index === -1) return null;
        bannedWords.splice(index, 1);
        settings.bannedWords = bannedWords;
        await settings.save().catch(console.error);
        return msg.reply(`Word successfully removed from the list of filtered words.`);
    }
};