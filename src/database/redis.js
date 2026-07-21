const { createClient } = require("redis");
require("dotenv").config();

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = process.env.REDIS_PORT || "6379";
const password = process.env.REDIS_PASSWORD || "";

const redisUrl =
  process.env.REDIS_URL ||
  (password
    ? `redis://:${password}@${host}:${port}`
    : `redis://${host}:${port}`);

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient
  .connect()
  .catch((err) => console.log("Unable to connect to Redis", err));

module.exports = redisClient;
