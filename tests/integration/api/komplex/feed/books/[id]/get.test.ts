import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../../src/app.js";
import { FEED_BASE } from "../../helpers.js";

describe("GET /api/komplex/feed/books/:id", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns 404 when book does not exist", async () => {
    const res = await request(app)
      .get(`${FEED_BASE}/books/999999`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
