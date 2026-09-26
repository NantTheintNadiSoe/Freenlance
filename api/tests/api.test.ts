import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Archer API", () => {
  it("reports health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("logs in a seeded demo account", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "freelancer13@archer.demo",
      password: "ArcherDemo123!"
    });
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("freelancer13@archer.demo");
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("lists open jobs with pagination metadata", async () => {
    const response = await request(app).get("/api/v1/jobs?page=1&pageSize=5");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(24);
    expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(5);
  });

  it("rejects protected requests without a bearer token", async () => {
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
