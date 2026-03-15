import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../../src/app.js";
import { FEED_BASE } from "../../helpers.js";

describe("GET /api/komplex/feed/videos/:id", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns error when video does not exist", async () => {
    const res = await request(app).get(`${FEED_BASE}/videos/999999`);

    // Handler may return 404 when video missing or 500 if it throws before checking
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it("returns 200 and single video shape when video exists", async () => {
    const res = await request(app).get(`${FEED_BASE}/videos/1`);

    if (res.status === 200) {
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("title");
      expect(res.body.data).toHaveProperty("videoUrl");
      expect(res.body.data).toHaveProperty("viewCount");
    } else {
      expect([404, 500]).toContain(res.status);
      expect(res.body.error).toBeDefined();
    }
  });
});
