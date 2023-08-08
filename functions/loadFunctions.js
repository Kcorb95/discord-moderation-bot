const path = require('path');
const fs = require('fs');
const Logger = require('../structures/Logger');

module.exports = client => new Promise(resolve => {
    if (!client.funcs) client.funcs = {};
    const dir = path.join(__dirname, '..', 'functions');
    const files = fs.readdirSync(dir).filter(file => file.endsWith('js'));
    let count = 0;
    for (const file of files) {
        const name = file.slice(0, -3);
        if (name === 'loadFunctions') continue;
        client.funcs[name] = require(`${dir}/${name}`);
        if (client.funcs[name].init) client.funcs[name].init(client);
        count++;
    }
    resolve(Logger.info(`Loaded ${count} functions.`));
});