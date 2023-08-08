const GuildSettings = require('../models/GuildSettings');

const antiRaidUserList = {};
const antiRaidChannelList = {};

exports.run = async (bot, message) => {
    if (message.author.bot) return null;
    if (message.channel.type === 'dm') return forwardDMS(bot, message);
    if (message.channel.type !== 'dm') {
        const inviteRegex = /(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i;
        if (!message.author.bot && message.channel.type === 'text' && !message.member.permissions.has(`MANAGE_MESSAGES`) && inviteRegex.test(message.content.toLowerCase())) message.delete();
        
        // checkRaid(message);
        checkFilteredWord(message);
    }
};

const checkRaid = async message => {
    // Check if settings.whitelistedchannels.includes(id) && !settings.blacklistedChannels.includes(id)
    // Check if member is new to server
    const joinCutoff = Date.now() - (30 * 60 * 1000); // If user is less than 30 minutes old in guild
    const ageCutoff = Date.now() - (7200 * 60 * 1000); // If user account is less than 5 days old
    if (message.member.joinedTimestamp > joinCutoff && message.member.user.createdTimestamp > ageCutoff) { // If user is less than 5 days old and been in server less than 30 minutes, TRACK
        trackUser(message);
        trackChannel(message);
    }
};

const trackChannel = message => {
    if (!antiRaidChannelList[message.guild.id])
        antiRaidChannelList[message.guild.id] = {};
    if (!antiRaidChannelList[message.guild.id][message.channel.id]) {
        antiRaidChannelList[message.guild.id][message.channel.id] = {
            lastMessage: message.content.toLowerCase(),
            messages: [],
            spamCount: 0,
            mentionCount: 0,
            largeMentionCount: 0
        };
        return setTimeout(() => delete antiRaidChannelList[message.guild.id][message.channel.id], 5 * 1000);
    }
    const channelList = antiRaidChannelList[message.guild.id][message.channel.id];
    if (channelList.lastMessage === message.content.toLowerCase() || // Start IF
        channelList.lastMessage.includes(message.content.toLowerCase()) ||
        message.content.toLowerCase().includes(channelList.lastMessage) ||
        channelList.messages.indexOf(message.content.toLowerCase()) !== -1) { // End IF
        channelList.spamCount++;
    }
    if (message.mentions && message.mentions.members.size >= 1) channelList.mentionCount++;
    if (message.mentions && message.mentions.members.size >= 3) channelList.largeMentionCount++;
    channelList.messages.push(channelList.lastMessage);
    channelList.mostRecentMessage = message.content.toLowerCase();
    if (channelList.messages.length >= 30 || channelList.spamCount === 10 || channelList.mentionCount === 6 || channelList.largeMentionCount === 4) message.guild.channels.get(`377475215778906122`)
        .send(`Channel Raid Detected: ${message.channel}.\n{\n    spamCount: ${channelList.spamCount},\n    mentionCount: ${channelList.mentionCount},\n    largeMentionCount: ${channelList.largeMentionCount},    messages.length: ${channelList.messages.length}\n}`);
};

const trackUser = message => {
    if (!antiRaidUserList[message.guild.id])
        antiRaidUserList[message.guild.id] = {};
    if (!antiRaidUserList[message.guild.id][message.member]) {
        antiRaidUserList[message.guild.id][message.member] = {
            lastMessage: message.content.toLowerCase(),
            messages: [],
            spamCount: 0,
            mentionCount: 0,
            largeMentionCount: 0
        };
        return setTimeout(() => delete antiRaidUserList[message.guild.id][message.member], 10 * 1000);
    }
    const userList = antiRaidUserList[message.guild.id][message.member];
    if (userList.lastMessage === message.content.toLowerCase() || // Start IF
        userList.lastMessage.includes(message.content.toLowerCase()) ||
        message.content.toLowerCase().includes(userList.lastMessage) ||
        userList.messages.indexOf(message.content.toLowerCase()) !== -1) { // End IF
        userList.spamCount++;
    }
    if (message.mentions && message.mentions.members.size >= 1) userList.mentionCount++;
    if (message.mentions && message.mentions.members.size >= 3) userList.largeMentionCount++;
    userList.messages.push(userList.lastMessage);
    userList.mostRecentMessage = message.content.toLowerCase();
    if (userList.messages.length >= 7 || userList.spamCount === 5 || userList.mentionCount === 3 || userList.largeMentionCount === 2) message.guild.channels.get(`377475215778906122`)
        .send(`User Raid Detected: ${message.channel}, ${message.member}.\n{\n    spamCount: ${userList.spamCount},\n    mentionCount: ${userList.mentionCount},\n    largeMentionCount: ${userList.largeMentionCount},    messages.length: ${userList.messages.length}\n}`);
};

const checkFilteredWord = async message => {
    if (message.author.id === message.client.options.owner) return null;
    const settings = await GuildSettings.findOne({ where: { guildID: message.guild.id } });
    if (!settings.bannedWords || !settings.bannedWords.length === 0) return null; // If no setting, skip rest of check
    settings.bannedWords.map(word => {
        if (message.content.toLowerCase().includes(word)) message.delete();
    });
};

const forwardDMS = async (bot, message) => {
    const guild = await bot.guilds.get('217402245250154498');
    const settings = await GuildSettings.findOne({ where: { guildID: guild.id } });
    if (message.attachments.array().length > 0) {
        if (!settings.helpChannel || !guild.channels.has(settings.helpChannel))
            return bot.owners[0].send(`\`${message.author.username}#${message.author.discriminator} (${message.author.id})\` **--** ${message.attachments.first().url}`);
        else
            guild.channels.get(settings.helpChannel).send(`${message.author} \`(${message.author.id})\` **--** ${message.attachments.first().url}`);
    }
    if (!settings.helpChannel || !guild.channels.has(settings.helpChannel))
        return bot.owners[0].send(`\`${message.author.username}#${message.author.discriminator} (${message.author.id})\` **--** ${message.content}`);
    else
        return guild.channels.get(settings.helpChannel).send(`${message.author} \`(${message.author.id})\` **--** ${message.content}`);
};
