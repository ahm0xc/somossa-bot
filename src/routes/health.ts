import { Hono } from "hono";
import { client } from "../discord/client";

const route = new Hono();

route.get("/", (c) =>
  c.json({
    status: "ok",
    discord: client.isReady() ? "connected" : "disconnected",
  })
);

export default route; 