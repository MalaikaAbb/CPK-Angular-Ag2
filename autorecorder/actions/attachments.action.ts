/**
 * Attachments — file picker, drag-and-drop, and paste into copilot-chat.
 *
 * https://docs.copilotkit.ai/angular/ag2/guides/threads-memory-attachments-headless
 *
 * Try it instructions:
 * 1. Open the demo and add a file.
 * 2. Send a message asking about it.
 * 3. Verify attachment is accepted and reply streams in.
 */
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { attachFixtureOnCamera, renderRevenueFixture } from './attach-file';

export const runAttachmentsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath,
  ctx,
) => {
  const [prompt = 'Have a look at the attached file. What is it?'] = promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  console.log(`   📎 Rendering and attaching test fixture image...`);
  const fixtureBytes = await renderRevenueFixture(page, rootPath);
  await attachFixtureOnCamera(page, fixtureBytes);

  console.log(`   💬 Sending attachments prompt: ${prompt}`);
  const msgCount = await sendPrompt(page, prompt);
  await waitForAgentResponseCompletion(page, wait, msgCount);
};

