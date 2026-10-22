/**
 * A2UI — schemas, styling, and recovery.
 *
 * https://docs.copilotkit.ai/angular/ag2/guides/a2ui
 *
 * Try it instructions:
 * 1. Open the demo and send "Show me a card comparing two flight options."
 * 2. Pass: a rendered declarative surface appears in the chat instead of a wall of text.
 *    Fail: raw JSON or protocol operations printed as text (runtime middleware not applied).
 */
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { beat, humanGlide } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { showNotepadNote } from './notepad';

export const runA2uiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [prompt = 'Show me a card comparing two flight options.'] = promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  console.log(`   💬 A2UI Prompt: ${prompt}`);
  const msgCount = await sendPrompt(page, prompt);

  await waitForAgentResponseCompletion(page, wait, msgCount);

  // Check last message for raw protocol / JSON
  const lastMsg = page.locator('copilot-chat-assistant-message').last();
  const text = (await lastMsg.textContent().catch(() => '')) || '';

  const isRawProtocol =
    text.includes('"operations":') ||
    text.includes('"version":') ||
    (text.startsWith('{') && text.endsWith('}'));

  if (isRawProtocol) {
    ctx.warn(
      'Raw JSON or protocol operations printed as text — A2UI catalog / middleware renderer was not active.',
    );
    await showNotepadNote(page, 'a2ui-status.txt', [
      'Finding: Raw operations printed as text.',
      'A2UI middleware is enabled, but supplying a2ui.catalog is what registers',
      'the render_a2ui renderer. Inert until a complete catalog is supplied.',
    ]);
  } else {
    console.log(`   ✅ A2UI response rendered.`);
  }

  const msgBox = await lastMsg.boundingBox().catch(() => null);
  if (msgBox) {
    await humanGlide(page, msgBox.x + msgBox.width / 2, msgBox.y + msgBox.height / 2, 22);
    await beat(2000);
  }
};

