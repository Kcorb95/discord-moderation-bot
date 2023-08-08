const { promisifyAll } = require('tsubaki');
const redisClient = require('redis');
const Logger = require('./Logger');

const { REDIS } = require('../settings.json');

promisifyAll(redisClient.RedisClient.prototype);
promisifyAll(redisClient.Multi.prototype);

const redis = redisClient.createClient(REDIS);

class Redis {
    static get db() {
        return redis;
    }

    static start() {
        redis.on('error', error => Logger.error(`[REDIS]: Encountered error: \n${error}`))
            .on('reconnecting', () => Logger.warn('[REDIS]: Reconnecting...'));
    }
}

module.exports = Redis;