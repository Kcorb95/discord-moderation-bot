const { Command } = require('commando');
const GuildSettings = require('../../models/GuildSettings');

module.exports = class AddFilteredWordCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'add-filtered-word',
            group: 'config',
            aliases: ['afw', 'addword', 'filterword'],
            memberName: 'add-filtered-word',
            description: 'Adds a word to the list of filtered words.',
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
        if (!bannedWords)
            bannedWords = [];
        if (bannedWords.indexOf(word) !== -1)
            return msg.reply('`Error: This word is already blocked!`');
        bannedWords.push(word);
        settings.bannedWords = bannedWords;
        await settings.save().catch(console.error);
        return msg.reply(`Word successfully added to list of filtered words.`);
    }
};