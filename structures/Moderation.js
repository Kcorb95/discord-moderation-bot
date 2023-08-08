const { stripIndents } = require('common-tags');
const moment = require('moment');
const ModLogs = require('../models/ModLogs');
const { TextChannel, Guild, Collection, User, MessageEmbed, MessageCollector } = require('discord.js'); // eslint-disable-line
const GuildSettings = require('../models/GuildSettings');

module.exports = class Moderation {
    constructor(mod, user, guild, reason, screenshot, type, mute, prune) {
        this.mod = mod;
        this.user = user;
        this.reason = reason;
        this.screenshot = screenshot;
        this.type = type;
        this.mute = mute;
        this.prune = prune;
        this.guild = guild;
        this.guildID = this.guild.id;
        this.caseCount = null;
        this.caseMessageID = null;
        this.globalCaseCount = 0;
    }

    static async initializeCases() {
        ModLogs.warnings = await this.getAllWarnings();
        ModLogs.strikes = await this.getAllStrikes();
        ModLogs.mutes = await this.getAllMutes();
        ModLogs.kicks = await this.getAllKicks();
        ModLogs.softbans = await this.getAllSoftbans();
        ModLogs.bans = await this.getAllBans();
        ModLogs.cases.push(...ModLogs.warnings);
        ModLogs.cases.push(...ModLogs.strikes);
        ModLogs.cases.push(...ModLogs.mutes);
        ModLogs.cases.push(...ModLogs.kicks);
        ModLogs.cases.push(...ModLogs.softbans);
        ModLogs.cases.push(...ModLogs.bans);
    }

    async postCase() {
        const settings = await GuildSettings.findOne({ where: { guildID: this.guildID } }) || await GuildSettings.create({ guildID: this.guildID });
        const channel = this.guild.channels.get(settings.moderationLoggingChannel);
        if (!channel) return null;

        await this.newCase();
        const embed = new MessageEmbed()
            .setColor(Moderation.getColor(this.type))
            .setAuthor(this.getMod(), this.mod.displayAvatarURL())
            .setDescription(this.formatDescription(this.type));
        if (this.screenshot.toLowerCase() !== 'skip') {
            embed.setImage(this.screenshot);
            embed.setURL(this.screenshot);
        }
        embed.setFooter(this.formatFooter(), this.guild.client.user.displayAvatarURL())
            .setTimestamp();

        const caseMessage = await channel.send({ embed });
        return this.updateCaseMessageID(caseMessage.id);
    }

    static async postHistory(user, channel) {
        const infractions = await Moderation.getInfractions(channel.guild.id, user.id);

        // General overview of all offenses
        const offenseTotal = new MessageEmbed()
            .setAuthor(`Offenses for ${Moderation.getUser(user).user}`, Moderation.getUser(user).avatar)
            .setDescription(infractions.total)
            .setFooter(`Offenses for ${Moderation.getUser(user).user}`, channel.guild.client.user.displayAvatarURL());
        if (infractions.warnings.length > 0)
            offenseTotal.addField(`Warnings (${infractions.warnings.length})`, infractions.warnings.map(warning => {
                return `${moment.utc(warning.createdAt).local().format('LLL')} **-- ${warning.reason}**`;
            }));
        if (infractions.strikes.length > 0)
            offenseTotal.addField(`Strikes (${infractions.strikes.length})`, infractions.strikes.map(strike => {
                return `${moment.utc(strike.createdAt).local().format('LLL')} **-- ${strike.reason}**`;
            }));
        if (infractions.mutes.length > 0)
            offenseTotal.addField(`Mutes (${infractions.mutes.length})`, infractions.mutes.map(mute => {
                return `${moment.utc(mute.createdAt).local().format('LLL')} **-- ${mute.mute} minutes -- ${mute.reason}**`;
            }));
        if (infractions.kicks.length > 0)
            offenseTotal.addField(`Kicks (${infractions.kicks.length})`, infractions.kicks.map(kick => {
                return `${moment.utc(kick.createdAt).local().format('LLL')} **-- ${kick.reason}**`;
            }));
        if (infractions.softbans.length > 0)
            offenseTotal.addField(`Softbans (${infractions.softbans.length})`, infractions.softbans.map(softban => {
                return `${moment.utc(softban.createdAt).local().format('LLL')} **-- ${softban.reason}**`;
            }));
        if (infractions.bans.length > 0)
            offenseTotal.addField(`Bans (${infractions.bans.length})`, infractions.bans.map(ban => {
                return `${moment.utc(ban.createdAt).local().format('LLL')} **-- ${ban.prune} -- ${ban.reason}**`;
            }));
        offenseTotal.setColor(`#4E259F`);
        offenseTotal.setThumbnail(user.displayAvatarURL());
        offenseTotal.setTimestamp();
        await channel.send({ embed: offenseTotal });
    }

    async newCase() {
        await this.getGlobalCaseCount(this.guildID);
        await ModLogs.sync();
        const newCase = await ModLogs.create({
            guildID: this.guildID,
            userID: this.user.id,
            globalCaseCount: this.globalCaseCount + 1,
            type: this.type,
            reason: this.reason,
            screenshot: this.screenshot.toUpperCase() === 'SKIP' ? null : this.screenshot, //I have no idea why this must be toUppercase.... but it does...
            caseCount: this.caseCount,
            mod: this.mod.id,
            prune: this.prune,
            mute: this.mute
        });
        ModLogs[`${this.type}s`].push(newCase);
        ModLogs.cases.push(newCase);
    }

    static
    async getCases(options) {
        return await ModLogs.findAll(options);
    }

    static getCase(gID, index) {
        return ModLogs.cases.find(thing => thing.globalCaseCount === index && thing.guildID === gID);
    }

    static getLastCase(gID) {
        const guildCases = ModLogs.cases.filter(thing => thing.guildID === gID);
        return ModLogs.cases ? guildCases[guildCases.length - 1] : null;
    }

    static lastCaseIs(gID, uID) {
        return this.getLastCase(gID).userID === uID;
    }

    async updateCaseMessageID(id, index) {
        if (!index) index = await this.getGlobalCaseCount(this.guildID);
        const dbCase = await ModLogs.findOne({ where: { guildID: this.guildID, globalCaseCount: index } });
        dbCase.caseMessageID = id;
        await dbCase.save();
        const cachedCase = Moderation.getCase(this.guildID, index);
        cachedCase.caseMessageID = id;
        ModLogs.cases[ModLogs.cases.indexOf(cachedCase)] = cachedCase;
    }

    static
    async updateCaseReason(index, gID, newReason) {
        const dbCase = await ModLogs.findOne({ where: { guildID: gID, globalCaseCount: index } });
        dbCase.reason = newReason;
        await dbCase.save();
        const cachedCase = this.getCase(gID, index);
        cachedCase.reason = newReason;
        ModLogs.cases[ModLogs.cases.indexOf(cachedCase)] = cachedCase;
    }

    updateReason(reason) {
        this.reason = reason;
    }

    static
    async getAllWarnings() {
        ModLogs.warnings = await this.getCases({ where: { type: 'warning' } });
        return ModLogs.warnings;
    }

    static
    async getAllStrikes() {
        ModLogs.strikes = await this.getCases({ where: { type: 'strike' } });
        return ModLogs.strikes;
    }

    static getWarningsFor(guild, user) {
        return ModLogs.warnings.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    static getStrikesFor(guild, user) {
        return ModLogs.strikes.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    static
    async getAllMutes() {
        ModLogs.mutes = await this.getCases({ where: { type: 'mute' } });
        return ModLogs.mutes;
    }

    static getMutesFor(guild, user) {
        return ModLogs.mutes.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    static
    async getAllKicks() {
        ModLogs.kicks = await this.getCases({ where: { type: 'kick' } });
        return ModLogs.kicks;
    }

    static getKicksFor(guild, user) {
        return ModLogs.kicks.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    static
    async getAllSoftbans() {
        ModLogs.softbans = await this.getCases({ where: { type: 'softban' } });
        return ModLogs.softbans;
    }

    static getSoftbansFor(guild, user) {
        return ModLogs.softbans.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    static
    async getAllBans() {
        ModLogs.bans = await this.getCases({ where: { type: 'ban' } });
        return ModLogs.bans;
    }

    static getBansFor(guild, user) {
        return ModLogs.bans.filter(aCase => aCase.userID === user && aCase.guildID === guild);
    }

    get currentCaseCount() {
        switch (this.type) {
            case 'warning':
                this.caseCount = ModLogs.warnings.length;
                return this.caseCount;
            case 'strike':
                this.caseCount = ModLogs.strikes.length;
                return this.caseCount;
            case 'mute':
                this.caseCount = ModLogs.mutes.length;
                return this.caseCount;
            case 'kick':
                this.caseCount = ModLogs.kicks.length;
                return this.caseCount;
            case 'softban':
                this.caseCount = ModLogs.softbans.length;
                return this.caseCount;
            case 'ban':
                this.caseCount = ModLogs.bans.length;
                return this.caseCount;
            default:
                return null;
        }
    }

    async getGlobalCaseCount(gid) {
        const cases = await Moderation.getCases({ where: { guildID: gid } });
        this.globalCaseCount = cases.length;
        return cases.length;
    }

    static getUser(user) {
        return {
            user: `${user.username}#${user.discriminator} (${user.id})`,
            avatar: user.displayAvatarURL()
        };
    }

    getMod() {
        if (this.mod) return `${this.mod.username}#${this.mod.discriminator}`;
        else return `Use reason \`${this.globalCaseCount}\` <new reason>`;
    }

    formatDescription(type) {
        switch (this.type) {
            case 'mute':
                return stripIndents`
			    **User**: ${this.user} -- ${Moderation.getUser(this.user).user}
			    **Action**: ${this.type}
			    **Duration**: ${this.mute} minutes
			    **Reason**: ${this.reason ? this.reason : `Use reason \`${this.globalCaseCount}\` <new reason>`}`;
            case 'ban':
                return stripIndents`
			    **User**: ${this.user} -- ${Moderation.getUser(this.user).user}
			    **Action**: ${this.type}
			    **Prune**: ${this.prune}
			    **Reason**: ${this.reason ? this.reason : `Use reason \`${this.globalCaseCount}\` <new reason>`}`;
            case 'softban':
                return stripIndents`
			    **User**: ${this.user} -- ${Moderation.getUser(this.user).user}
			    **Action**: ${this.type}
			    **Prune**: ${this.prune}
			    **Reason**: ${this.reason ? this.reason : `Use reason \`${this.globalCaseCount}\` <new reason>`}`;
            default:
                return stripIndents`
			    **User**: ${this.user} -- ${Moderation.getUser(this.user).user}
			    **Action**: ${this.type}
			    **Reason**: ${this.reason ? this.reason : `Use reason \`${this.globalCaseCount}\` <new reason>`}`;
        }
    }


    static getColor(type) {
        switch (type) {
            case 'warning':
                return '#E0DB2B';
            case 'strike':
                return '#4E259F';
            case 'mute':
                return '#2BDBE0';
            case 'kick':
                return '#E1690B';
            case 'softban':
                return '#5B730F';
            case 'ban':
                return '#7E1616';
            default:
                return '#F1F0EB';
        }
    }

    formatFooter() {
        return `Fuck-Up # ${this.globalCaseCount + 1}`;
    }

    static getInfractions(guild, user) {
        const warnings = this.getWarningsFor(guild, user);
        const strikes = this.getStrikesFor(guild, user);
        const mutes = this.getMutesFor(guild, user);
        const kicks = this.getKicksFor(guild, user);
        const softbans = this.getSoftbansFor(guild, user);
        const bans = this.getBansFor(guild, user);
        const infractions = {
            total: `This user has:\n**${warnings.length}** warnings, **${strikes.length}** strikes, **${mutes.length}** mutes, **${kicks.length}** kicks, **${softbans.length}** softbans, **${bans.length}** bans`,
            warnings: warnings,
            strikes: strikes,
            mutes: mutes,
            kicks: kicks,
            softbans: softbans,
            bans: bans
        };
        return infractions;
    }
};