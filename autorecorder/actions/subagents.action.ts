/**
 * Sub-agents — supervisor delegating to research, writing, and critique agents.
 *
 * https://docs.copilotkit.ai/angular/ag2/multi-agent/subagents
 *
 * Try it instructions:
 * 1. Open demo and send "Research, write, and critique a short paragraph on solar panels."
 * 2. Pass: a card appears in the transcript as each sub-agent runs, and the delegation log
 *    on the left grows to three entries -- research, writing, critique.
 *    Fail: cards render but the log stays empty.
 */
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { beat, humanGlide } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { showNotepadNote } from './notepad';

export const runSubagentsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [prompt = 'Research, write, and critique a short paragraph on solar panels.'] =
    promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  // Pre-check: is subagents supervisor running on port 8001?
  let supervisorUp = false;
  try {
    const res = await fetch('http://localhost:8001/subagents/status', { method: 'GET' }).catch(
      () => null,
    );
    supervisorUp = Boolean(res && (res.status === 200 || res.status === 405 || res.status === 404));
  } catch {}

  console.log(`   💬 Subagents supervisor prompt: ${prompt}`);
  const msgCount = await sendPrompt(page, prompt);

  try {
    await waitForAgentResponseCompletion(page, wait, msgCount);
  } catch (err: any) {
    if (!supervisorUp) {
      await showNotepadNote(page, 'subagents-supervisor.txt', [
        'NOTE: The Subagents supervisor backend (port 8001) is not running.',
        'Start with: cd backend/subagents && uv run main.py',
        'The main app and default agent (port 8000) remain functional.',
      ]);
      ctx.warn('Subagents supervisor process (port 8001) was not reachable.');
      return;
    }
    throw err;
  }

  // Inspect delegation log
  const delegationEntries = page.locator('showcase-delegation-log article, showcase-delegation-log .delegation-item');
  const count = await delegationEntries.count().catch(() => 0);
  console.log(`   📋 Observed ${count} delegation log entry/entries.`);

  const logBox = await page.locator('showcase-delegation-log').boundingBox().catch(() => null);
  if (logBox) {
    await humanGlide(page, logBox.x + logBox.width / 2, logBox.y + 120, 20);
    await beat(2000);
  }

  if (count === 0) {
    ctx.warn(
      'Delegation log stayed empty. ContextVariables from subagents may not have reached delegations state slot.',
    );
  } else {
    console.log(`   ✅ Subagents delegation log populated (${count} entries).`);
  }
};

