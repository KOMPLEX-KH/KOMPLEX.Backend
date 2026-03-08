import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("GET /ping", () => {
  it("returns 200 and body 'pong'", async () => {
    const app = createApp();
    const res = await request(app).get("/ping").expect(200);
    expect(res.text).toBe("pong");
  });
});