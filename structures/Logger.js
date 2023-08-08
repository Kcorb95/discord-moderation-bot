/* eslint-disable no-console */
const { blue, cyan, magenta, red, yellow } = require('chalk');
const moment = require('moment');

module.exports = class Logger {
    constructor() {
        this.colours = {
            info: 3247335,
            warn: 16567385,
            error: 13369344
        };
    }


    static info(data) {
        return console.log(`${blue(`[${moment().format('MMMM Do YYYY, h:mm:ss a')}]`)} ${cyan(data)}`);
    }

    static debug(data) {
        return console.log(`${magenta(`[${moment().format('MMMM Do YYYY, h:mm:ss a')}]`)} ${magenta(data)}`);
    }

    static warn(data) {
        return console.warn(`${yellow(`[${moment().format('MMMM Do YYYY, h:mm:ss a')}]`)} ${yellow(data)}`);
    }

    static error(data) {
        return console.error(`${red(`[${moment().format('MMMM Do YYYY, h:mm:ss a')}]`)} ${red(data)}`);
    }
};