/**
 * Shared state — the browser writes agent state and provides context, then the agent reads it.
 *
 * https://docs.copilotkit.ai/angular/ag2/guides/shared-state
 *
 * Based on <ui-try-it> in shared-state.ts:
 * 1. Click "Mark high priority"
 * 2. Ask "What is my current priority and what notes do I have?"
 * 3. Ask "What is my name?" -> Expects Ada
 * 4. Ask "What is my timezone?" -> Expects America/Los_Angeles
 * 5. Click "Use London time"
 * 6. Ask "What timezone am I in, and which record am I looking at?" -> Expects Europe/London and record-42
 */
import { type Page } from 'playwright';

import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { beat, humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

export const runSharedStateAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [
    priorityPrompt = 'What is my current priority and what notes do I have?',
    namePrompt = 'What is my name?',
    tzPrompt = 'What is my timezone?',
    londonPrompt = 'What timezone am I in, and which record am I looking at?',
  ] = promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  // ── Step 1: Mark High Priority ─────────────────────────────────────────────
  console.log(`   🔄 Step 1: Clicking "Mark high priority"...`);
  const highBtn = page
    .locator('app-workspace button:has-text("Mark high priority")')
    .first();

  const highBox = await highBtn.boundingBox().catch(() => null);
  if (highBox) {
    await humanGlide(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2, 20);
    await sleep(400);
    await humanClick(page);
    await beat(1000);
  } else {
    ctx.warn('"Mark high priority" button not found.');
  }

  console.log(`   💬 Asking priority: ${priorityPrompt}`);
  const count1 = await sendPrompt(page, priorityPrompt);
  await waitForAgentResponseCompletion(page, wait, count1);
  await beat(1000);

  // ── Step 2: Ask Name (Context) ─────────────────────────────────────────────
  console.log(`   💬 Asking name: ${namePrompt}`);
  const count2 = await sendPrompt(page, namePrompt);
  await waitForAgentResponseCompletion(page, wait, count2);
  await beat(1000);

  // ── Step 3: Ask Timezone (Initial America/Los_Angeles) ──────────────────────
  console.log(`   💬 Asking initial timezone: ${tzPrompt}`);
  const count3 = await sendPrompt(page, tzPrompt);
  await waitForAgentResponseCompletion(page, wait, count3);
  await beat(1000);

  // ── Step 4: Click Use London time ──────────────────────────────────────────
  const timezoneBtn = page
    .locator('app-account-context button:has-text("Use London time")')
    .first();
  const tzBox = await timezoneBtn.boundingBox().catch(() => null);
  if (tzBox) {
    console.log(`   🌍 Step 4: Clicking "Use London time"...`);
    await humanGlide(page, tzBox.x + tzBox.width / 2, tzBox.y + tzBox.height / 2, 20);
    await sleep(400);
    await humanClick(page);
    await beat(1000);
  } else {
    ctx.warn('"Use London time" button not found.');
  }

  // ── Step 5: Ask London timezone & record ────────────────────────────────────
  console.log(`   💬 Asking updated context: ${londonPrompt}`);
  const count4 = await sendPrompt(page, londonPrompt);
  await waitForAgentResponseCompletion(page, wait, count4);

  // Rest on the context & state panel
  const accountContext = page.locator('app-account-context').first();
  const ctxBox = await accountContext.boundingBox().catch(() => null);
  if (ctxBox) {
    console.log(`   🎯 Resting on the read-only context component.`);
    await humanGlide(page, ctxBox.x + ctxBox.width / 2, ctxBox.y + ctxBox.height / 2, 22);
    await beat(1500);
  }
};
