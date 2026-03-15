import request from "supertest";
import { Express } from "express";

const FEED_BASE = "/api/komplex/feed";

/** Return type of request(app).get() — has .expect() and is awaitable for response */
type SupertestGet = ReturnType<ReturnType<typeof request>["get"]>;

export function feedGet(
  app: Express,
  path: string,
  query?: Record<string, string>
): SupertestGet {
  const req = request(app).get(`${FEED_BASE}${path}`);
  if (query) {
    req.query(query);
  }
  return req;
}

export { FEED_BASE };
