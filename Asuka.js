const { FriendlyError, SequelizeProvider } = require('commando');
const Discord = require('discord.js');
const CommandoClient = require('./structures/CommandoClient');

const Moderation = require('./structures/Moderation');

const { oneLine } = require('common-tags');
const path = require('path');

const { OWNER, TOKEN, COMMAND_PREFIX } = require('./settings');
const Logger = require('./structures/Logger');

const loadEvents = require('./functions/loadEvents.js');
const loadFunctions = require('./functions/loadFunctions.js');
const syncGuilds = require('./functions/syncGuilds.js');

const client = new CommandoClient({
    owner: OWNER,
    commandPrefix: COMMAND_PREFIX,
    unknownCommandResponse: false,
    disableEveryone: true,
    clientOptions: { disabledEvents: ['USER_NOTE_UPDATE', 'VOICE_STATE_UPDATE', 'TYPING_START', 'VOICE_SERVER_UPDATE', 'PRESENCE_UPDATE'] }
});

client.setProvider(new SequelizeProvider(client.database));

client.on('error', Logger.error)
    .on('warn', Logger.warn)
    .once('ready', () => {
        Logger.info(oneLine`
			Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
        client.user.setActivity('with Rei');
        loadFunctions(client).then(() => {
            loadEvents(client);
            syncGuilds(client);
            client.methods = {};
            client.methods.Collection = Discord.Collection;
            client.methods.Embed = Discord.MessageEmbed;
            client.log = Logger;
        });
        Moderation.initializeCases().then(() => Logger.info('Successfully initialized cases')).catch(err => Logger.error(err));
    })
    .on('disconnect', () => {
        Logger.warn(`[DISCORD]: [${Date.now()}] Disconnected! Exiting app in 10s.`);
        setTimeout(() => {
            process.exit('1');
        }, 10000);
    })
    .on('reconnect', () => Logger.warn('[DISCORD]: Reconnecting...'))
    .on('commandRun', (cmd, promise, msg, args) => {
        Logger.info(oneLine`
			[DISCORD]: ${msg.author.tag} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args).length ? `>>> ${Object.values(args)}` : ''}
		`);
    })
    .on('disconnect', () => {
        Logger.warn(`[DISCORD]: [${Date.now()}] Disconnected! Exiting app in 10s.`);
        setTimeout(() => {
            process.exit('1');
        }, 10000);
    })
    .on('disconnect', () => {
        Logger.warn(`[DISCORD]: [${Date.now()}] Disconnected! Exiting app in 10s.`);
        setTimeout(() => {
            process.exit('1');
        }, 10000);
    })
    .on('reconnect', () => Logger.warn('[DISCORD]: Reconnecting...'))
    .on('commandRun', (cmd, promise, msg, args) => {
        Logger.info(oneLine`
			[DISCORD]: ${msg.author.tag} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args).length ? `>>> ${Object.values(args)}` : ''}
		`);
    })
    .on('commandError', (cmd, err) => {
        if (err instanceof FriendlyError) return;
        Logger.error(`[DISCORD]: Error in command ${cmd.groupID}:${cmd.memberName}`, err);
    })
    .on('commandBlocked', (msg, reason) => {
        Logger.info(oneLine`
			[DISCORD]: Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.tag} (${msg.author.id}): ${reason}
		`);
    })
    .on('commandPrefixChange', (guild, prefix) => {
        Logger.info(oneLine`
			[DISCORD]: Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('commandStatusChange', (guild, command, enabled) => {
        Logger.info(oneLine`
			[DISCORD]: Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('groupStatusChange', (guild, group, enabled) => {
        Logger.info(oneLine`
			[DISCORD]: Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    });

client.registry
    .registerGroups([
        ['commands', 'Commands'],
        ['administration', 'Administration', { roles: true, channels: false }],
        ['config', 'Config'],
        ['info', 'Info'],
        ['moderation', 'Moderation', { roles: true, channels: false }],
        ['owner', 'Owner'],
        ['util', 'Util']
    ])
    .registerDefaultTypes()
    .registerCommandsIn(path.join(__dirname, 'commands'))
    .registerDefaultCommands({ eval_: true });

client.login(TOKEN);

process.on('unhandledRejection', err => {
    if (!err) return;

    let errorString = 'Uncaught Promise Error!!: \n';
    if (err.status === 400) return Logger.error(errorString += err.text || err.body.message); // eslint-disable-line consistent-return
    if (!err.response) return Logger.error(errorString += err.stack); // eslint-disable-line consistent-return

    if (err.response.text && err.response.status) {
        errorString += `Status: ${err.response.status}: ${err.response.text}\n`;
    }
    if (err.response.request && err.response.request.method && err.response.request.url) {
        errorString += `Request: ${err.response.request.method}: ${err.response.request.url}\n`;
    }
    Logger.error(errorString += err.stack);
});

exports.client = client;