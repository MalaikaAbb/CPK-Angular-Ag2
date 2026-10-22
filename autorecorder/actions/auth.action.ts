/**
 * Authentication — gated Copilot Runtime with session tokens and CORS.
 *
 * https://docs.copilotkit.ai/angular/ag2/auth
 *
 * Try it instructions:
 * 1. Verify gate: /api/copilotkit-auth/info returns 401 without token, 200 with Bearer demo-token-123.
 * 2. In demo, click "Sign in with demo token".
 * 3. Send "Hello" in the signed-in chat.
 * 4. Verify reply streams in.
 * 5. Click "Sign out" to return to the sign-in card.
 */
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { beat, humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

export const runAuthAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [helloPrompt = 'Hello'] = promptsFor(config);
  const wait = config.waitAfterPromptMs ?? 4000;

  // 1. Probe the gate via fetch to verify 401 and 200
  try {
    const unauthRes = await fetch('http://localhost:8200/api/copilotkit-auth/info');
    if (unauthRes.status !== 401) {
      ctx.warn(`Gated info probe without token returned ${unauthRes.status}, expected 401.`);
    }

    const authRes = await fetch('http://localhost:8200/api/copilotkit-auth/info', {
      headers: { Authorization: 'Bearer demo-token-123' },
    });
    if (authRes.status !== 200) {
      ctx.warn(`Gated info probe with demo token returned ${authRes.status}, expected 200.`);
    }
  } catch (err) {
    ctx.warn(`Could not probe gated runtime at http://localhost:8200/api/copilotkit-auth/info: ${err}`);
  }

  // 2. Click "Sign in with demo token"
  console.log(`   🔐 Step 1: Clicking "Sign in with demo token"...`);
  const signInBtn = page
    .locator('button[data-testid="auth-sign-in-button"], button:has-text("Sign in")')
    .first();

  await signInBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {
    ctx.fail('Sign-in button not found in Auth demo.');
  });

  const btnBox = await signInBtn.boundingBox().catch(() => null);
  if (btnBox) {
    await humanGlide(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, 20);
    await sleep(300);
    await humanClick(page);
    await beat(1200);
  }

  // 3. Wait for chat to mount and send "Hello"
  console.log(`   💬 Step 2: Sending "${helloPrompt}" to authenticated runtime...`);
  const msgCount = await sendPrompt(page, helloPrompt);
  await waitForAgentResponseCompletion(page, wait, msgCount);

  // 4. Click "Sign out"
  console.log(`   🚪 Step 3: Clicking "Sign out"...`);
  const signOutBtn = page
    .locator('button[data-testid="auth-sign-out-button"], button:has-text("Sign out")')
    .first();

  const outBox = await signOutBtn.boundingBox().catch(() => null);
  if (outBox) {
    await humanGlide(page, outBox.x + outBox.width / 2, outBox.y + outBox.height / 2, 20);
    await sleep(300);
    await humanClick(page);
    await beat(1500);
  } else {
    ctx.warn('Sign out button not found after chat completion.');
  }

  // Confirm returned to sign-in card
  const cardVisible = await page
    .locator('article[data-testid="auth-sign-in-card"], text=Sign in to start chatting')
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!cardVisible) {
    ctx.warn('Did not return to sign-in card after signing out.');
  } else {
    console.log(`   ✅ Successfully signed out and returned to sign-in card.`);
  }
};

