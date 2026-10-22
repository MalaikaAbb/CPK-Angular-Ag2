/**
 * Memory — injectMemories with the isAvailable() gate.
 *
 * https://docs.copilotkit.ai/angular/ag2/guides/threads-memory-attachments-headless
 *
 * Try it instructions:
 * 1. Open the demo and read the left panel.
 * 2. Pass (this runtime): "Memory is not available for this runtime." — the isAvailable() gate resolved false.
 *    Pass (a runtime with memory routes): the memory list renders and Forget removes an entry.
 *    Fail: an empty panel with neither the list nor the fallback, or a thrown error.
 */
import { type Page } from 'playwright';
import { beat, humanGlide } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

export const runMemoryAction: PageActionHandler = async (
  page: Page,
  _config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  console.log(`   🧠 Checking Memory demo panel and fallback gate...`);
  const memoryPanel = page.locator('app-memory-list, app-memory-demo').first();

  await memoryPanel.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {
    ctx.fail('Memory panel never rendered.');
  });

  const text = (await memoryPanel.textContent().catch(() => '')) || '';

  const fallbackRendered = text.includes('Memory is not available for this runtime');
  const listRendered = text.includes('Forget') || (await page.locator('app-memory-list article').count()) > 0;

  if (fallbackRendered) {
    console.log(`   ✅ Expected fallback rendered: "Memory is not available for this runtime."`);
  } else if (listRendered) {
    console.log(`   ✅ Memory list rendered with active memory routes.`);
  } else {
    ctx.fail('Memory panel rendered empty without the fallback message or memory list.');
  }

  const box = await memoryPanel.boundingBox().catch(() => null);
  if (box) {
    await humanGlide(page, box.x + box.width / 2, box.y + 80, 20);
    await beat(2500);
  }
};

