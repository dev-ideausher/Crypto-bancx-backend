const redis = require("redis");
const { REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = require("./config");
const redisClient = redis.createClient({
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

module.exports = redisClient;
