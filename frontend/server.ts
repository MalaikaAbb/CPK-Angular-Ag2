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

const runtime = new CopilotRuntime({
  agents: {
    default: new Ag2Agent({ url: agentUrl }),
    support: new Ag2Agent({ url: agentUrl }),
  },
  a2ui: {},
});

const port = Number(process.env["PORT"] ?? 8200);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(`AG2 agent: ${agentUrl}`);
});
