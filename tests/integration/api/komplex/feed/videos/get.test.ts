import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../src/app.js";
import { feedGet, FEED_BASE } from "../helpers.js";

describe("GET /api/komplex/feed/videos", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns 200 and success wrapper with data array when no videos", async () => {
    const res = await request(app).get(`${FEED_BASE}/videos`).expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it("accepts query params type, topic, page without error", async () => {
    const res = await feedGet(app, "/videos", {
      type: "lesson",
      topic: "math",
      page: "2",
    }).expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("response data items have expected shape when present", async () => {
    const res = await request(app).get(`${FEED_BASE}/videos`).expect(200);
    const data = res.body.data;

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("userId");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("videoUrl");
      expect(first).toHaveProperty("thumbnailUrl");
      expect(first).toHaveProperty("viewCount");
      expect(first).toHaveProperty("likeCount");
      expect(first).toHaveProperty("isLiked");
      expect(first).toHaveProperty("isSaved");
    }
  });
});
