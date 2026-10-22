/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ACTION REGISTRY & EXECUTION PIPELINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * What the recorder *does* on each demo page once it is open.
 *
 * All pages are registered to their respective action handlers based on
 * the <ui-try-it> sections of the Angular demo pages.
 *
 * Error handling automatically overlays an authentic Notepad Error Report
 * on screen when a step fails, guaranteeing that the error video includes
 * the failure reasons and reporting notes.
 */

import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import { handleTakeError } from './error-reporter';

import { runChatUiAction } from './chat-ui.action';
import { runHeadlessAction } from './headless.action';
import { runHitlAction } from './hitl.action';
import { runSharedStateAction } from './shared-state.action';
import { runThreadsAction } from './threads.action';
import { runToolsAction } from './tools.action';
import { runVoiceAction } from './voice.action';
import { runA2uiAction } from './a2ui.action';
import { runWebmcpAction } from './webmcp.action';
import { runAuthAction } from './auth.action';
import { runSubagentsAction } from './subagents.action';
import { runMemoryAction } from './memory.action';
import { runAttachmentsAction } from './attachments.action';

/**
 * Keys are page ids from `config/pages.config.ts`.
 * Exactly matches all 14 routes from frontend/src/app/lib/nav-config.ts.
 */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  quickstart: runStandardAction,
  'chat-ui': runChatUiAction,
  'frontend-tools-generative-ui': runToolsAction,
  a2ui: runA2uiAction,
  'voice-multimodal': runVoiceAction,
  'human-in-the-loop': runHitlAction,
  'shared-state': runSharedStateAction,
  webmcp: runWebmcpAction,
  threads: runThreadsAction,
  memory: runMemoryAction,
  attachments: runAttachmentsAction,
  headless: runHeadlessAction,
  auth: runAuthAction,
  subagents: runSubagentsAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  await waitForPageReady(page, { label: config.id });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;

  const caughtFailures: string[] = [];
  const wrappedCtx: ActionContext = {
    ...ctx,
    fail: (msg: string) => {
      caughtFailures.push(msg);
      ctx.fail(msg);
    },
  };

  try {
    await handler(page, config, rootPath, wrappedCtx);

    if (caughtFailures.length > 0) {
      const combined = caughtFailures.join('; ');
      await handleTakeError(page, config, new Error(combined), ctx);
      throw new Error(combined);
    }
  } catch (err: any) {
    if (caughtFailures.length === 0) {
      await handleTakeError(page, config, err, ctx);
    }
    throw err;
  }
}
