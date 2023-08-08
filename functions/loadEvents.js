const path = require('path');
const fs = require('fs');
const Logger = require('../structures/Logger');

let events = require('discord.js/src/util/Constants.js').Events;
events = Object.values(events);
const storage = {};

module.exports = client => {
    const dir = path.join(__dirname, '..', 'events');
    const files = fs.readdirSync(dir).filter(file => events.includes(file.slice(0, -3)));
    let count = 0;
    for (const file of files) {
        const name = file.slice(0, -3);
        storage[name] = require(`${dir}/${name}`);
        client.on(name, (...args) => storage[name].run(client, ...args));
        count++;
    }
    Logger.info(`Loaded ${count} events.`);
};