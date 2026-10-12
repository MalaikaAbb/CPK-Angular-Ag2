import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subagents-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subagents" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Start the supervisor (<code>cd backend/subagents && uv run
          main.py</code>), open the demo and send
          <em>Research, write, and critique a short paragraph on solar
          panels.</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> a card appears in the transcript as each
          sub-agent runs, and the delegation log on the left grows to three
          entries — research, writing, critique — each carrying that sub-agent's
          output. <strong>Fail:</strong> the cards render but the log stays
          empty — the <code>ContextVariables</code> each tool returns in its
          <code>ReplyResult</code> are not reaching the
          <code>delegations</code> state slot.
        </p>
      </ui-try-it>

      <ui-panel heading="Backend — sub-agents exposed as tools">
        <p class="mb-3 text-sm text-slate-700">
          The guide's "Setting up sub-agents" and "Exposing sub-agents as
          tools" code, plus the supervisor that wires them together. Each
          delegation tool runs its sub-agent, appends to
          <code>delegations</code> in <code>ContextVariables</code>, and
          returns a <code>ReplyResult</code> carrying them.
        </p>
        <ui-source path="../backend/subagents/subagents.py" />
      </ui-panel>

      <ui-panel heading="Mounting the supervisor">
        <p class="mb-3 text-sm text-slate-700">
          <code>backend/subagents/main.py</code> mounts it at
          <code>/subagents</code> on <code>:8001</code>, and
          <code>server.ts</code> registers that URL under the runtime key
          <code>subagents</code> — the same key and path the showcase uses.
        </p>
        <ui-source path="../backend/subagents/main.py" />
      </ui-panel>

      <ui-panel heading="Pinned to ag2 below 1.0">
        <p class="mb-3 text-sm text-slate-700">
          The guide's code imports from <code>autogen</code>, which ag2 1.0
          removed. The supervisor therefore runs in its own uv project with the
          showcase's pin, beside the 1.x weather agent in
          <code>backend/main.py</code>.
        </p>
        <ui-source path="../backend/subagents/pyproject.toml" />
      </ui-panel>

      <ui-panel heading="Rendering a live delegation log">
        <ui-source
          path="src/app/features/subagents/subagents-chat.component.ts"
        />
      </ui-panel>

      <ui-panel heading="Reading the delegations slot">
        <ui-source path="src/app/features/subagents/subagent-model.ts" />
      </ui-panel>

      <ui-panel heading="One renderer per sub-agent tool">
        <ui-source
          path="src/app/features/subagents/subagent-renderer-config.ts"
        />
      </ui-panel>

      <ui-panel heading="Transcript card and delegation log">
        <ui-source path="src/app/features/subagents/subagent-cards.ts" />
      </ui-panel>

      <ui-callout title="Not in the guide — taken from the showcase source">
        The guide's Python stops at the three delegation tools; the
        <code>supervisor</code>, <code>stream</code> and
        <code>subagents_app</code> come from the showcase file the guide
        quotes, copied unchanged. On the frontend the guide does not show
        <code>readDelegations</code>, <code>subAgentRendererConfig</code>, or
        either card component; they are the sub-agent half of the Angular
        Showcase's <code>features/agent-state/</code>, unchanged, with the
        unrelated planner card left out.
      </ui-callout>
    </div>
  `,
})
export default class SubagentsPage {}
