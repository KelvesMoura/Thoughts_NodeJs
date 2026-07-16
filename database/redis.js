const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient
  .connect()
  .catch((err) => console.log("Unable to connect to Redis", err));

module.exports = redisClient;
