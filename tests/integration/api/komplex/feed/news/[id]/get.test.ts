import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../../src/app.js";
import { FEED_BASE } from "../../helpers.js";

describe("GET /api/komplex/feed/news/:id", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns 404 when news does not exist", async () => {
    const res = await request(app).get(`${FEED_BASE}/news/999999`);

    // Params are strings; handler may validate and return 400 or return 404 when not found
    expect([400, 404]).toContain(res.status);
    expect(res.body.error).toBeDefined();
  });
});
