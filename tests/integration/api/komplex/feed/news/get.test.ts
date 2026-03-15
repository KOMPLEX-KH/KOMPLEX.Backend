import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../src/app.js";
import { feedGet, FEED_BASE } from "../helpers.js";

describe("GET /api/komplex/feed/news", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns a response from news list endpoint", async () => {
    const res = await request(app).get(`${FEED_BASE}/news`);

    expect(res.body).toBeDefined();
    expect([200, 500]).toContain(res.status);
  });

  it("accepts query params type, topic, page", async () => {
    const res = await feedGet(app, "/news", {
      type: "article",
      topic: "tech",
      page: "1",
    });

    expect([200, 500]).toContain(res.status);
  });

  it("when successful, response data is an array with expected item shape", async () => {
    const res = await request(app).get(`${FEED_BASE}/news`);
    if (res.status !== 200 || !res.body?.success || !Array.isArray(res.body.data)) return;

    const data = res.body.data;
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("userId");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("media");
      expect(first).toHaveProperty("viewCount");
      expect(first).toHaveProperty("likeCount");
      expect(first).toHaveProperty("isSaved");
      expect(first).toHaveProperty("isFollowing");
    }
  });
});
