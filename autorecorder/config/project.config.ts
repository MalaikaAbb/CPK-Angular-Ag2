/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 1 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Who this project is: which CopilotKit integration it tests, where its docs
 * live, and how its two services are reached and started.
 *
 * Everything else derives from this. Doc and demo URLs are built from
 * `docBaseUrl` and `frontendUrl`, so a page never repeats them and no page can
 * point at a different framework's docs by accident.
 *
 * `npm run doctor` rejects any field still set to REPLACE_ME, so a half-done
 * adaptation cannot pass as finished.
 */

/** Sentinel for values an adaptation must supply. Doctor fails while any remain. */
export const REPLACE_ME = 'REPLACE_ME' as const;

export interface ProjectConfig {
  /**
   * Doc slug, exactly as it appears in the URL:
   * `https://docs.copilotkit.ai/<framework>/...`
   * e.g. 'ms-agent-python', 'ms-agent-dotnet', 'agno', 'ag2', 'langgraph'.
   */
  framework: string;

  /** Human name for logs and the README, e.g. 'Microsoft Agent Framework (Python)'. */
  frameworkLabel: string;

  /**
   * Filename prefix for exported videos. Files are named
   * `<videoPrefix>-<NN>-<videoName>.webm`, the index coming from page order.
   *
   * **Name it for BOTH sides of the integration — `<AGENT>-<frontend>`:**
   * 'MSPY-react', 'MSNET-react', 'AG2-angular'.
   */
  videoPrefix: string;

  /** Doc root this repo tracks. Every page's docPath is appended to it. */
  docBaseUrl: string;

  /** Where the app runs. Every page's route is appended to it. */
  frontendUrl: string;

  /** Where the agent runs. Used only for the pre-flight health check. */
  backendUrl: string;

  /** Health path on the backend. The check falls back to `/docs` then `/`. */
  backendHealthPath: string;

  /** Printed verbatim when the pre-flight check fails, so the fix is copy-pasteable. */
  frontendStartCmd: string;
  backendStartCmd: string;

  /**
   * Appended to each page's route to reach the chrome-free demo.
   * Set to '' if this project's demos live directly on the route.
   */
  demoSuffix: string;

  /**
   * Project-wide overrides of the recorder's fixed waits. Optional; the
   * defaults in `core/timeouts.ts` suit a warm dev server. Raise `demoNavMs`
   * for a stack whose first request compiles the route.
   */
  timeouts?: Partial<import('../core/types').RecorderTimeouts>;

  /**
   * Frontend path the browser calls to reach the agent, relative to
   * `frontendUrl` — e.g. '/api/copilotkit'.
   */
  runtimeWarmPath: string;
}

export const PROJECT: ProjectConfig = {
  framework: 'ag2',
  frameworkLabel: 'AG2 (Python) + Angular',
  videoPrefix: 'AG2-angular',

  docBaseUrl: 'https://docs.copilotkit.ai/angular/ag2',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
  backendHealthPath: '/status',

  frontendStartCmd: 'cd frontend && npm run dev',
  backendStartCmd: 'cd backend && uv run main.py',

  demoSuffix: '/demo',

  runtimeWarmPath: 'http://localhost:8200/api/copilotkit/info',
};

/** Absolute doc URL for a page's `docPath`. */
export function docUrlFor(docPath: string): string {
  return `${PROJECT.docBaseUrl.replace(/\/$/, '')}/${docPath.replace(/^\//, '')}`;
}

/** Absolute demo URL for a page's `route`. */
export function demoUrlFor(route: string): string {
  return `${PROJECT.frontendUrl.replace(/\/$/, '')}/${route.replace(/^\//, '')}${PROJECT.demoSuffix}`;
}
