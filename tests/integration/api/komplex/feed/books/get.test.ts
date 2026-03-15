import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../src/app.js";
import { FEED_BASE } from "../helpers.js";

describe("GET /api/komplex/feed/books", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("returns 200 and success wrapper with data array when no books", async () => {
    // Books route is mounted with get("/") so use trailing slash
    const res = await request(app).get(`${FEED_BASE}/books/`).expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("response data items have expected shape when present", async () => {
    const res = await request(app).get(`${FEED_BASE}/books/`).expect(200);
    const data = res.body.data;

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const first = data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("pdfUrl");
      expect(first).toHaveProperty("imageUrl");
    }
  });
});
