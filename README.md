# CopilotKit + AG2 Test Suite — Angular

A navigable, working test harness for the Angular section of the CopilotKit
docs, wired to an [AG2](https://ag2.ai) agent — each guide is a route that runs
the thing it describes.

| | |
|---|---|
| **CopilotKit packages** | `@copilotkit/angular` 0.3.1 · `@copilotkit/runtime` 1.67.1 |
| **AG-UI packages** | `@ag-ui/ag2` 0.0.2 (`Ag2Agent`, a thin `HttpAgent` subclass) |
| **Frontend** | Angular 22.1.1 · TypeScript 6.0 · Tailwind 4 · zoneless |
| **Runtime** | Node 24.16.0 · Copilot Runtime v2 Node listener on :8200 |
| **Backend** | Python 3.13 · `ag2[ag-ui,openai]` 1.0.3 · FastAPI / uvicorn on :8000 |
| **Tracks** | <https://docs.copilotkit.ai/angular/ag2> |

The frontend is the Angular harness from the sibling `agno/` repo, byte-for-byte
except for the files that bind it to a backend (listed under
[What changed from the Agno harness](#what-changed-from-the-agno-harness)). The
backend follows `weather.py` in
[ag2ai/ag2-samples](https://github.com/ag2ai/ag2-samples) — the repo the
[AG2 quickstart](https://docs.copilotkit.ai/ag2/quickstart) clones — reduced to
one `getWeather(city)` tool.

---

## Architecture

Three processes, not two.

```
Browser (Angular 22, zoneless)
  │  @copilotkit/angular — provideCopilotKit, <copilot-chat>, signal APIs
  │  POST http://localhost:8200/api/copilotkit
  ▼
Copilot Runtime  ·  localhost:8200        ← Node, frontend/server.ts
  │  agents: { default, support } → new Ag2Agent({ url })
  │  a2ui: {}  → A2UIMiddleware
  │  POST http://localhost:8000/weather/  ← AG-UI over SSE
  ▼
AG2 AGUIStream  ·  localhost:8000         ← Python / FastAPI, backend/main.py
  │  app.mount("/weather", AGUIStream(agent).build_asgi())
  │  tools=[getWeather]
  ▼
OpenAI  (gpt-4o-mini)
```

- **Why three.** Unlike the React/Next quickstart, where the runtime lives inside
  the Next app as an API route, Angular has no server route to host it — so the
  Copilot Runtime is its own Node process.
- **Why `Ag2Agent`.** AG2's `AGUIStream` serves the AG-UI protocol directly over
  SSE, so any AG-UI HTTP client works. `@ag-ui/ag2` exports `Ag2Agent`, which
  is `class Ag2Agent extends HttpAgent {}` — the framework-named binding, the
  same way `agno/` uses `@ag-ui/agno`.
- **Why `/weather/` with a slash.** The sample mounts the stream at `/weather`;
  Starlette answers the slash-less URL with a redirect, so the runtime is
  pointed at the trailing-slash form.
- **Why two agent ids.** `default` and `support` both resolve to the same AG2
  process. `default` is what CopilotKit's prebuilt components use with no
  configuration; `support` exists so the Chat UI and Threads guides' snippets —
  written as `agentId="support"` — run exactly as published.
- **The model key never reaches the browser**, and never reaches the runtime
  either. Only the Python process holds it.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 22+ (built on 24.16.0) | The Angular quickstart specifies Node 22. |
| npm | 10+ (built on 12.0.1) | Or pnpm/yarn. |
| Python | 3.10–3.14 (built on 3.13) | Per `backend/.python-version`; `ag2` requires ≥ 3.10. |
| [`uv`](https://docs.astral.sh/uv/) | 0.11+ (built on 0.11.20) | Used for the backend. `pip` works too. |
| OpenAI API key | — | Required. |
| CopilotKit license key | — | **Optional.** Only affects the Threads and Memory routes. |

`@angular/cdk` must share your Angular major version. If you hit a
peer-dependency error, pin it explicitly (`@angular/cdk@^22` on Angular 22).

---

## Setup

**1. Install frontend deps**

```bash
cd frontend && npm install && cd ..
```

**2. Install backend deps**

```bash
cd backend && uv sync && cd ..
```

**3. Provide the model key**

`backend/main.py` calls `load_dotenv()`, which walks up from `backend/` — so a
`.env` at the repo root or in `backend/` both work, as does the shell
environment:

```bash
cp .env.example .env     # then set OPENAI_API_KEY
# or
export OPENAI_API_KEY=sk-...
```

**Environment variables**

| Variable | Where | What it does |
|---|---|---|
| `OPENAI_API_KEY` | **agent** (`.env` or shell) | **Required.** The model key. |
| `OPENAI_CHAT_MODEL_ID` | agent | Model for the AG2 agent. Default `gpt-4o-mini`. |
| `WEATHER_TOOL_DELAY` | agent | Seconds `getWeather` sleeps so the tool card's in-progress state is observable. Default `1.5`; `0` disables. |
| `AG2_AGENT_URL` | shell for the **runtime** | Where the runtime finds the agent. Default `http://localhost:8000/weather/`. |
| `PORT` | shell for the **runtime** | Runtime port. Default `8200`. |
| `COPILOTKIT_TELEMETRY_DISABLED` | shell for the **runtime** | Opt out of anonymous runtime telemetry. |

> The Angular app's `runtimeUrl` is hardcoded to
> `http://localhost:8200/api/copilotkit` in `frontend/src/app/app.config.ts`,
> following the quickstart. If you change `PORT`, change that too.

**Default ports:** frontend **4200**, runtime **8200**, agent **8000**.

---

## Running the project

Three processes. The two Node ones share a terminal; the Python agent gets its own.

**Terminal 1 — the agent:**

```bash
cd backend
uv run main.py
```

Success looks like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
```

**Terminal 2 — the runtime and the app together:**

```bash
cd frontend
npm run dev
```

`dev` runs the Copilot Runtime and `ng serve` side by side under `concurrently`,
each line prefixed by which process wrote it. Success looks like:

```
[runtime] Copilot Runtime listening at http://localhost:8200/api/copilotkit
[runtime] AG2 agent: http://localhost:8000/weather/
[angular]   ➜  Local:   http://localhost:4200/
```

Ctrl-C stops both. `--kill-others` means a crash in either takes the other down
rather than leaving half a stack running.

To run them separately — different terminals, independent restarts:

```bash
npm run runtime   # Copilot Runtime only, :8200
npm start         # Angular dev server only, :4200
```

Open **<http://localhost:4200>**. The Introduction route probes both backends and
shows a connection panel — check it first if anything misbehaves.

---

## Verifying it works

**1. The agent is up.** `/status` is a plain GET added for the harness's
connection panel (the AG-UI mount itself is POST-only):

```bash
curl -s http://localhost:8000/status
# {"status":"ok","agent":"WeatherAgent","agui":"/weather/"}
```

**2. The runtime sees both agents:**

```bash
curl -s http://localhost:8200/api/copilotkit/info
```

Should list `default` and `support` under `agents`, with `"a2uiEnabled": true`.

**3. End to end** — a real run through the whole stack, including the tool:

```bash
curl -N -X POST http://localhost:8200/api/copilotkit/agent/default/run \
  -H 'Content-Type: application/json' \
  -d '{"threadId":"t1","runId":"r1","messages":[{"id":"m1","role":"user","content":"What is the weather in London?"}],
       "tools":[],"context":[],"state":{},"forwardedProps":{}}'
```

You should see AG-UI events stream back, with a `getWeather` tool call in the
middle:

```
data: {"type":"RUN_STARTED",...}
data: {"type":"TOOL_CALL_START","toolCallName":"getWeather",...}
data: {"type":"TOOL_CALL_ARGS","delta":"{\"city\":\"London\"}",...}
data: {"type":"TOOL_CALL_END",...}
data: {"type":"TOOL_CALL_RESULT","content":"The weather for London is 70 degrees.",...}
data: {"type":"TEXT_MESSAGE_CONTENT","delta":"The"...}
```

**4. In the browser** — open `/frontend-tools-generative-ui/demo` and send
`What's the weather in London?`. The `WeatherCardComponent` registered with
`registerRenderToolCall({ name: 'getWeather' })` should show its loading state
for ~1.5 s, then the completed card with the tool result, followed by the
agent's one-sentence summary.

---

## What to expect — per route

| Route | Try | Success |
|---|---|---|
| `/quickstart/demo` | `Can you tell me a joke?` | Tokens stream one at a time and render as markdown. |
| `/chat-ui/demo` | Any message in each of the four surfaces | Same conversation continues across surfaces; the custom assistant message renders. |
| `/frontend-tools-generative-ui/demo` | `What's the weather in Tokyo?` then `change the background to sunset` | Weather card renders the server tool's result; the page background changes from the browser tool. |
| `/human-in-the-loop/demo` | `Delete all my files` | The agent calls `requestApproval` and waits for the card's answer. The interrupt panel stays idle — the agent emits no AG-UI interrupt. |
| `/shared-state/demo` | `Add a note: buy milk` | The notes list updates if the agent writes state — see Known issues. |
| `/headless/demo` | Any message | Transcript and composer built on `injectAgentStore` stream the reply. |
| `/threads`, `/memory` | — | Locked / empty without an Intelligence license. Expected. |

---

## Other commands

```bash
npm run build         # production build → dist/frontend
npm run gen:sources   # regenerate the on-page source map (auto-runs on start/build)
npm test              # Vitest
```

`scripts/generate-sources.ts` reads the real files off disk into
`src/app/lib/generated-sources.ts`, so the code shown on a route page is what
actually runs.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Chat sends, nothing streams back | Runtime or agent process down | Check the Introduction route's connection panel; `curl http://localhost:8200/api/copilotkit/info`. |
| `/info` returns nothing | Runtime not started | `npm run runtime` from `frontend/`. |
| Agent exits immediately, or runs fail on the model call | No `OPENAI_API_KEY` reachable from `backend/` | `.env` at the repo root or in `backend/`, or `export OPENAI_API_KEY=sk-...`. |
| Runtime run answers a 307 and no events | `AG2_AGENT_URL` without the trailing slash | Use `http://localhost:8000/weather/` — Starlette redirects `/weather`. |
| `[Errno 98] Address already in use` | Another framework harness in this workspace (agno, pydantic-ai, …) also defaults to :8000 | `ss -ltnp \| grep :8000` and check `ls -l /proc/<pid>/cwd`. Stop it, or run this agent elsewhere: `uv run uvicorn main:app --port 8001` plus `AG2_AGENT_URL=http://localhost:8001/weather/`. |
| Agent probe red while :8000 **is** listening | A *different* project's backend holds the port — it has no `/status` | Same check as above. |
| Connection errors mentioning `localhost` | DNS resolving to IPv6 while the server binds IPv4 | Use `127.0.0.1` in `AG2_AGENT_URL`. |
| A run starts, then hangs forever | The agent called a browser tool with no registered handler, so no result returns | Every tool the agent can call needs a matching `registerFrontendTool` / `registerHumanInTheLoop` mounted. |
| Chat renders unstyled | Missing stylesheet | `@import "@copilotkit/angular/styles.css";` must be in `src/styles.css`. |
| CORS errors from the browser | Runtime CORS off | Keep `cors: true` in `createCopilotNodeListener`. |
| Thread list empty, drawer shows a lock | No license key | Expected — not a bug. |
| Source panels say "Source not generated" | Generated map is stale | `npm run gen:sources`. |

---

## What changed from the Agno harness

`frontend/` is a copy of `../agno/frontend`. Only the binding to the backend
was touched:

| File | Change |
|---|---|
| `frontend/package.json` | `@ag-ui/agno` → `@ag-ui/ag2` |
| `frontend/server.ts` | `AgnoAgent` → `Ag2Agent`; `AGNO_AGENT_URL` → `AG2_AGENT_URL`, default `http://localhost:8000/weather/` |
| `frontend/src/app/components/backend-health.ts` | Probe label `Agno agent` → `AG2 agent` (same `GET /status` URL) |
| `frontend/src/app/components/nav-sidebar.ts` | Sidebar title |
| `frontend/src/app/pages/introduction.ts` | Architecture diagram and process names |
| `frontend/src/app/pages/quickstart.ts` | Panel heading and binding name |
| `frontend/src/app/app.config.ts` | Comment only |
| `nav-config.ts`, `pages/*`, `features/*` | Every `docs.copilotkit.ai/angular/agno/...` reference → `/angular/ag2/...` (`DOCS_ROOT`, each `docPath`, and the doc-URL comments) |

Everything under `frontend/src/app/features/` — every line of CopilotKit code —
is identical to the Agno harness.

`backend/main.py` is new. Compared with `ag2-samples/weather.py`:

- one tool, `getWeather(city)`, returning a string — the name and the `city`
  argument are what the frontend's `registerRenderToolCall` matches on;
- the sample's Open-Meteo geocoding/forecast tools, `Variable`-cached location,
  and dataclass results are dropped (the harness's card renders `call.result`
  as text);
- `OpenAIConfig` (chat completions) instead of `OpenAIResponsesConfig`, with the
  model read from `OPENAI_CHAT_MODEL_ID`;
- a `GET /status` route and CORS for the harness's connection panel;
- `load_dotenv()` and `uvicorn.run(..., reload=True)`, matching the sibling harnesses.

---

## Known issues / discrepancies

- **Route prose written for the Agno backend.** The `/human-in-the-loop`,
  `/shared-state`, `/frontend-tools-generative-ui`, `/chat-ui` and `/threads`
  pages describe the backend as "the Agno agent". Where they describe behaviour
  (e.g. "Agno does not support interrupts"), read them as describing this AG2
  backend's current state, which is the same: no AG-UI interrupt is emitted.
- **Shared state is not wired on the backend.** The Agno backend kept
  `session_state={notes, priority}` and let the model update it. This AG2 agent
  holds no state, so `/shared-state`'s `injectAgentStore` sees an empty state
  and nothing updates. AG2's `Variable`/`Context` machinery is the place to add
  it.
- **A2UI is inert**, as in the Agno harness — `a2ui: {}` is set on the runtime
  but no `a2ui.catalog` is supplied on the frontend.
- **Voice, Threads, Memory** — same limits as the Agno harness: no transcription
  service, no Intelligence license.

---

## Project structure

```
ag2/
├── README.md
├── CLAUDE.md                  # harness spec (Angular variant), doc scope /angular/ag2
├── .env.example
│
├── frontend/                  # Angular 22 app + the Copilot Runtime process
│   ├── server.ts              # ★ CopilotRuntime + Ag2Agent binding  → :8200
│   ├── scripts/generate-sources.ts
│   └── src/app/
│       ├── app.config.ts      # ★ provideCopilotKit, a2ui, openGenerativeUI
│       ├── lib/nav-config.ts  # routes, docs, status — single source of truth
│       ├── components/        # harness chrome (nav, header, source, health)
│       ├── features/          # ★ the doc code that actually runs (unchanged)
│       └── pages/             # one page per doc route + demos + status
│
└── backend/                   # Python agent — AG2 over AG-UI  → :8000
    ├── pyproject.toml         # ag2[ag-ui,openai], fastapi, uvicorn, python-dotenv
    └── main.py                # ★ Agent + getWeather tool + AGUIStream mount
```

---

## Current state

Verified locally on 2026-09-03: `npm run build` ✅ · runtime registers `default`
and `support` with `a2uiEnabled: true` ✅ · agent answers `GET /status` on
:8000 ✅ · **live end-to-end run streaming AG-UI events through the full stack,
including a `getWeather` tool call and result** ✅.

---

## References

**Getting Started** — [Angular + AG2 quickstart](https://docs.copilotkit.ai/angular/ag2/quickstart) · [AG2 quickstart](https://docs.copilotkit.ai/ag2/quickstart)

**Guides** — [Chat UI and customization](https://docs.copilotkit.ai/angular/ag2/guides/chat-ui) · [Frontend tools and generative UI](https://docs.copilotkit.ai/angular/ag2/guides/frontend-tools-generative-ui) · [A2UI](https://docs.copilotkit.ai/angular/ag2/guides/a2ui) · [Voice and multimodal](https://docs.copilotkit.ai/angular/ag2/guides/voice-multimodal) · [Human-in-the-loop and interrupts](https://docs.copilotkit.ai/angular/ag2/guides/human-in-the-loop) · [Shared state and agent context](https://docs.copilotkit.ai/angular/ag2/guides/shared-state) · [Threads, memory, attachments, and headless UI](https://docs.copilotkit.ai/angular/ag2/guides/threads-memory-attachments-headless)

**Backend** — [Copilot Runtime](https://docs.copilotkit.ai/angular/ag2/backend/copilot-runtime)

**External** — [ag2ai/ag2-samples](https://github.com/ag2ai/ag2-samples) · [AG2 AG-UI docs](https://docs.ag2.ai/latest/docs/user-guide/ag-ui/) · [`@ag-ui/ag2`](https://www.npmjs.com/package/@ag-ui/ag2) · [AG-UI protocol](https://ag-ui.com) · [Angular API reference](https://docs.copilotkit.ai/reference/angular)
