/**
 * Copilot Runtime for this harness.
 *
 * Shape comes from the Angular quickstart's Node runtime server
 * (https://docs.copilotkit.ai/angular/ag2/quickstart), with the agent swapped
 * for the `Ag2Agent` binding from `@ag-ui/ag2` — the Angular/AG2 quickstart
 * defers the backend step to "register this backend as the `default` agent".
 *
 * `Ag2Agent` is a thin subclass of the generic AG-UI `HttpAgent`: AG2's
 * `AGUIStream` serves the AG-UI protocol directly over SSE, so the runtime
 * simply POSTs to the mount in backend/main.py.
 *
 * `default` and `support` resolve to the same AG2 process. `support` exists so
 * the doc snippets that use `agentId="support"` (Chat UI, Threads) run verbatim.
 * `subagents` is the Sub-Agents supervisor, a separate AG2 process
 * (backend/subagents/main.py) — the key and `/subagents` path the showcase uses.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/ag2/backend/copilot-runtime
 */
import { createServer } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { Ag2Agent } from "@ag-ui/ag2";

// backend/main.py mounts AGUIStream at /weather. Starlette redirects the
// slash-less form, so the trailing slash is load-bearing.
const agentUrl =
  process.env["AG2_AGENT_URL"] ?? "http://localhost:8000/weather/";

// backend/subagents/main.py mounts the supervisor at /subagents; same
// trailing-slash rule.
const subagentsUrl =
  process.env["AG2_SUBAGENTS_URL"] ?? "http://localhost:8001/subagents/";

const runtime = new CopilotRuntime({
  agents: {
    default: new Ag2Agent({ url: agentUrl }),
    support: new Ag2Agent({ url: agentUrl }),
    subagents: new Ag2Agent({ url: subagentsUrl }),
  },
  // auth : forward identity deliberately start
  forwardHeaders: {
    allow: ["authorization", "x-tenant-id"],
  },
  // auth : forward identity deliberately end
  a2ui: {},
});

const port = Number(process.env["PORT"] ?? 8200);

/**
 * Credentialed CORS, from the Authentication guide's "Send cookies to a
 * cross-origin runtime": the app sets `credentials: "include"`, so the runtime
 * must answer with `credentials: true` and the app's exact origins — never
 * `*`. These are the two origins this repo serves the app from: `ng serve`
 * (package.json `start`) and the built SSR server (src/server.ts).
 *
 * `allowHeaders` is listed because its default is `["*"]`, which browsers take
 * literally on credentialed requests — so JSON POSTs and the `Authorization`
 * header would fail their preflight. It holds what the client sends
 * (`content-type`, `authorization`), the license header `provideCopilotKit`
 * adds when a key is set, and the `x-tenant-id` the forwardHeaders allowlist
 * names.
 */
const cors = {
  origin: ["http://localhost:4200", "http://localhost:4000"],
  credentials: true,
  allowHeaders: [
    "content-type",
    "authorization",
    "x-copilotcloud-public-api-key",
    "x-tenant-id",
  ],
};

// auth : authenticated runtime start
/**
 * A second runtime for the /auth demo, gated by the Authentication guide's
 * `onRequest` hook. It is separate — as in the CopilotKit showcase's
 * `/api/copilotkit-auth` route — because gating the main runtime would answer
 * 401 to every other route in this harness.
 *
 * The guide's `createCopilotExpressHandler` is swapped for the
 * `createCopilotNodeListener` this server already uses; both take the same
 * `hooks` option. `verifySession` is not defined by the guide: it is the
 * showcase's static demo-token check. Never use a hard-coded shared secret
 * for real auth.
 */
const DEMO_TOKEN = "demo-token-123";

async function verifySession(token: string) {
  return token === DEMO_TOKEN ? { token } : null;
}

const authRuntime = new CopilotRuntime({
  agents: {
    default: new Ag2Agent({ url: agentUrl }),
  },
});

const authListener = createCopilotNodeListener({
  runtime: authRuntime,
  basePath: "/api/copilotkit-auth",
  cors,
  hooks: {
    onRequest: async ({ request }) => {
      const token = request.headers
        .get("authorization")
        ?.replace(/^Bearer\s+/i, "");
      const session = token ? await verifySession(token) : null;

      if (!session) {
        throw new Response("Unauthorized", { status: 401 });
      }
    },
  },
});
// auth : authenticated runtime end

const listener = createCopilotNodeListener({
  runtime,
  basePath: "/api/copilotkit",
  cors,
});

createServer((req, res) =>
  req.url?.startsWith("/api/copilotkit-auth")
    ? authListener(req, res)
    : listener(req, res),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(
    `Authenticated runtime listening at http://localhost:${port}/api/copilotkit-auth`,
  );
  console.log(`AG2 agent: ${agentUrl}`);
  console.log(`AG2 sub-agents supervisor: ${subagentsUrl}`);
});
