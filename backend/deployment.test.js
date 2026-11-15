import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "test-password-at-least-12";
process.env.AUTH_SECRET = "test-only-secret-that-is-at-least-32-bytes";
process.env.FRONTEND_ORIGIN =
  "https://ithaly-ciaodmilano-backend.vercel.app";
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";

const [{ handleRequest }, { config }] = await Promise.all([
  import("./server.js"),
  import("./api/[...path].js"),
]);
const server = createServer(handleRequest);

before(
  () =>
    new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    }),
);

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

function getUrl(path) {
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}${path}`;
}

describe("Vercel API deployment", () => {
  it("disables Vercel body parsing for the streaming JSON reader", () => {
    assert.equal(config.api.bodyParser, false);
  });

  it("answers credentialed preflight requests for the deployed frontend", async () => {
    const response = await fetch(getUrl("/api/auth/login"), {
      method: "OPTIONS",
      headers: {
        Origin: process.env.FRONTEND_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      process.env.FRONTEND_ORIGIN,
    );
    assert.equal(
      response.headers.get("access-control-allow-credentials"),
      "true",
    );
    assert.match(
      response.headers.get("access-control-allow-methods") ?? "",
      /POST/,
    );
    assert.match(
      response.headers.get("access-control-allow-headers") ?? "",
      /Content-Type/i,
    );
  });

  it("sets and validates the production session cookie through login and logout", async () => {
    const origin = process.env.FRONTEND_ORIGIN;
    const login = await fetch(getUrl("/api/auth/login"), {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    });

    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie") ?? "";
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=None/i);
    assert.match(setCookie, /Secure/i);
    const cookie = setCookie.split(";")[0];
    assert.match(cookie, /^cdm-session=/);

    const authenticated = await fetch(getUrl("/api/not-a-route"), {
      headers: { Origin: origin, Cookie: cookie },
    });
    assert.equal(authenticated.status, 404);

    const logout = await fetch(getUrl("/api/auth/logout"), {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  });

  it("rejects origins not configured for production", async () => {
    const response = await fetch(getUrl("/api/auth/login"), {
      method: "OPTIONS",
      headers: {
        Origin: "https://untrusted.example",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(response.status, 403);
  });
});
