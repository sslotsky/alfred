import { createClient } from "redis";

let client: ReturnType<typeof createClient>;

export const redisClient = () => {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
  }

  return client;
};
