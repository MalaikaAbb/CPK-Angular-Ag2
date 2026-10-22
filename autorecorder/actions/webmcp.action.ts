/**
 * WebMCP — frontend tool integration with WebMCP annotations.
 *
 * https://docs.copilotkit.ai/angular/ag2/webmcp
 *
 * Try it instructions:
 * 1. Open the demo and send "Which of my orders are still open?"
 * 2. Pass: The agent calls searchOrders with status: "open" and names the keyboard and the desk lamp.
 *    Fail: It guesses -- the frontend tool is not registered.
 * 3. Inspect the document.modelContext status panel on the left.
 */
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { beat, humanGlide } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

export const runWebmcpAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [prompt = 'Which of my orders are still open?'] = promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  console.log(`   💬 WebMCP Prompt: ${prompt}`);
  const msgCount = await sendPrompt(page, prompt);

  await waitForAgentResponseCompletion(page, wait, msgCount);

  // Inspect the document.modelContext panel on the left
  const panel = page.locator('app-webmcp-chat').locator('text=document.modelContext').first();
  const box = await panel.boundingBox().catch(() => null);
  if (box) {
    console.log(`   🎯 Hovering over document.modelContext status...`);
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
    await beat(2000);
  }

  // Check last message for mentions of open orders (keyboard / lamp)
  const lastMsg = page.locator('copilot-chat-assistant-message').last();
  const text = (await lastMsg.textContent().catch(() => '')) || '';
  const mentionsOrders =
    /keyboard|lamp|ord-1001|ord-1004/i.test(text);

  if (!mentionsOrders) {
    ctx.warn(
      'Agent reply did not clearly mention the open orders (keyboard/desk lamp). Check if searchOrders tool was called.',
    );
  } else {
    console.log(`   ✅ Agent answered with open orders.`);
  }
};

