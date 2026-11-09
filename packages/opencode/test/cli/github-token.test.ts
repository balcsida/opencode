// Runs the real `github run` CLI against a stub GitHub API. The stub fails the first
// repo request, so the command goes straight to its finally block, where it revokes tokens.
import { expect, test } from "bun:test"
import path from "node:path"
import { tmpdir } from "../fixture/fixture"

const cliEntry = path.resolve(import.meta.dir, "../../src/index.ts")

async function revokedTokens(env: Record<string, string>) {
  const revoked: string[] = []
  using server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === "/exchange_github_app_token") return Response.json({ token: "minted-token" })
      if (req.method === "DELETE" && url.pathname === "/installation/token") {
        revoked.push(req.headers.get("authorization") ?? "")
        return new Response(null, { status: 204 })
      }
      return new Response("stub failure", { status: 500 })
    },
  })
  await using home = await tmpdir()
  const event = {
    eventName: "workflow_dispatch",
    repo: { owner: "acme", repo: "widgets" },
    actor: "octocat",
    payload: {},
  }
  const proc = Bun.spawn(
    ["bun", "run", cliEntry, "github", "run", "--token", "oidc-token", "--event", JSON.stringify(event)],
    {
      cwd: home.path,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        PATH: process.env["PATH"] ?? "",
        HOME: home.path,
        OPENCODE_TEST_HOME: home.path,
        XDG_CONFIG_HOME: path.join(home.path, ".config"),
        XDG_DATA_HOME: path.join(home.path, ".local/share"),
        XDG_STATE_HOME: path.join(home.path, ".local/state"),
        XDG_CACHE_HOME: path.join(home.path, ".cache"),
        OPENCODE_DISABLE_PROJECT_CONFIG: "1",
        OPENCODE_PURE: "1",
        OPENCODE_DISABLE_AUTOUPDATE: "1",
        OPENCODE_DISABLE_MODELS_FETCH: "1",
        OPENCODE_AUTH_CONTENT: "{}",
        MODEL: "test/test-model",
        GITHUB_RUN_ID: "1",
        PROMPT: "hi",
        GITHUB_API_URL: server.url.href,
        GITHUB_GRAPHQL_URL: server.url.href,
        OIDC_BASE_URL: server.url.href,
        ...env,
      },
    },
  )
  const stderr = await new Response(proc.stderr).text()
  expect(await proc.exited).toBe(1)
  expect(stderr).toContain("stub failure")
  return revoked
}

test("revokes the app token it minted", async () => {
  expect(await revokedTokens({})).toEqual(["Bearer minted-token"])
}, 60_000)

test("does not revoke a caller-supplied GHES_APP_TOKEN", async () => {
  expect(await revokedTokens({ GHES_APP_TOKEN: "caller-token" })).toEqual([])
}, 60_000)
