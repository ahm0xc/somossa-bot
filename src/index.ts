import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

import { env } from "./env";
import { initDiscordClient, client } from "./discord/client";
import { setupRoutes } from "./routes";

// Initialize discord client
initDiscordClient();

// Initialize Hono app
const app = new Hono();

// Add authentication middleware
app.use("*", bearerAuth({ token: env.SECRET_KEY }));

// Setup routes
setupRoutes(app);

// Start the server
const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server running on port ${env.PORT}`);

// Graceful shutdown
process.on("SIGINT", () => {
  server.close();
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    client.destroy();
    process.exit(0);
  });
}); 