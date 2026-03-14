import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../../../../../src/app.js";

describe("GET /api/komplex/feed/forums", () => {
    it("returns 200 and body with forums", async () => {
        const app = createApp();
        const res = await request(app).get("/api/komplex/feed/forums").expect(200);

        expect(res.body).toBeDefined();
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();

        expect(Array.isArray(res.body.data)).toBe(true);
    });
});