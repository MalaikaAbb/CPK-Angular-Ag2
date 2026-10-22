/**
 * Error Reporting and Efficient Error Video Annotator.
 *
 * Captures on-camera Notepad error notes when a demo interaction fails,
 * basing the reporting on the Try It section instructions of each page.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Page } from 'playwright';
import { type ActionContext, type PageRecordConfig } from '../core/types';
import { openNotepadWindow, typeInNotepad } from './notepad';
import { sleep } from '../core/overlays/cursor';

export interface TryItSpec {
  instruction: string;
  passCriteria: string;
  failCriteria: string;
  notes: string;
}

export const TRY_IT_MAP: Record<string, TryItSpec> = {
  quickstart: {
    instruction: "Open demo and send 'Can you tell me a joke?'",
    passCriteria: 'Tokens stream in one at a time and render as markdown.',
    failCriteria: 'Nothing streams — one of the two backends is down.',
    notes: 'Verify backend (FastAPI :8000) and runtime (:8200) are running with OPENAI_API_KEY set.',
  },
  'chat-ui': {
    instruction: "Send 'What is CopilotKit?' on Inline chat, then walk Custom assistant, Popup, and Sidebar tabs.",
    passCriteria: 'Inline chat has scoped blue styling; custom assistant message component renders; popup and sidebar open.',
    failCriteria: 'Surface renders blank, tabs look identical, styles bleed across tabs, or launcher opens wrong surface.',
    notes: 'Scoped CSS .support-chat applies only to inline tab.',
  },
  'frontend-tools-generative-ui': {
    instruction: "Send 'What\\'s the weather in Tokyo?', 'Change the background to violet', and 'Show me incident INC-4711 at sev1'.",
    passCriteria: 'Server tool renders WeatherCardComponent; frontend tool repaints background violet; display tool renders IncidentCardComponent.',
    failCriteria: 'Plain text with no card, background stays grey, or incident card fails to render.',
    notes: 'Ensure tool names and argument schemas match between backend/main.py and frontend tools-chat.component.ts.',
  },
  a2ui: {
    instruction: "Open demo and send 'Show me a card comparing two flight options.'",
    passCriteria: 'Rendered declarative surface appears in chat instead of a wall of text.',
    failCriteria: 'Raw JSON or protocol operations printed as text.',
    notes: 'A2UIMiddleware is enabled in server.ts; supplying a2ui.catalog is required for full custom rendering.',
  },
  'voice-multimodal': {
    instruction: 'Attach a PNG or PDF via picker, drag-and-drop, or paste. Then press microphone.',
    passCriteria: 'File accepted and sent as content part; microphone records audio.',
    failCriteria: 'File rejected incorrectly or composer fails to record.',
    notes: 'Transcription is expected to fail on this runtime as no speech-to-text service is configured.',
  },
  'human-in-the-loop': {
    instruction: "Send 'Delete my account, but ask me to approve it first.'",
    passCriteria: 'Approve/Reject card renders in message stream and run pauses until decision clicked.',
    failCriteria: 'Options as plain text or agent continues without waiting for user approval.',
    notes: 'Verify requestApproval tool is registered in ApprovalToolsService.',
  },
  'shared-state': {
    instruction: "Press 'Mark high priority', ask priority and name ('Ada'), ask timezone ('America/Los_Angeles'). Then press 'Use London time' and ask timezone and record.",
    passCriteria: 'Agent correctly reports high priority, Ada, Europe/London, and record-42.',
    failCriteria: 'Agent does not know about updated priority or read-only account context.',
    notes: 'Verify injectAgentStore and CopilotKitAgentContext bindings.',
  },
  webmcp: {
    instruction: "Send 'Which of my orders are still open?'",
    passCriteria: "Agent calls searchOrders with status: 'open' and names the keyboard and desk lamp.",
    failCriteria: 'Agent guesses without calling the frontend tool.',
    notes: 'Ensure searchOrders tool is registered with WebMCP annotations.',
  },
  threads: {
    instruction: 'Open demo and inspect headless list and threads drawer.',
    passCriteria: 'Unlicensed: list renders controls with no threads, drawer renders locked state. Licensed: threads manage.',
    failCriteria: 'Blank area with no locked state at all.',
    notes: 'Threads require a CopilotKit Enterprise Intelligence license; locked state is expected unlicensed behavior.',
  },
  memory: {
    instruction: 'Open demo and read left panel.',
    passCriteria: "'Memory is not available for this runtime.' fallback renders when runtime has no memory routes.",
    failCriteria: 'Empty panel with neither list nor fallback, or thrown error.',
    notes: 'injectMemories isAvailable() gate correctly reports false on this runtime.',
  },
  attachments: {
    instruction: 'Add a file via picker, drag-and-drop, or paste, and send a message asking about it.',
    passCriteria: 'File accepted and sent; oversized file rejected with onUploadFailed logged.',
    failCriteria: 'Attachment fails or oversized file accepted.',
    notes: 'Bound through AttachmentsConfig on copilot-chat.',
  },
  headless: {
    instruction: 'Type into bare textarea and press Send.',
    passCriteria: "Message appears in transcript, 'Agent is working…' displays, reply streams in.",
    failCriteria: 'Send does nothing or transcript never updates.',
    notes: 'Built on injectAgentStore and CopilotKitCore.runAgent.',
  },
  auth: {
    instruction: "Verify gated /api/copilotkit-auth/info is 401/200; click 'Sign in', send 'Hello', then 'Sign out'.",
    passCriteria: 'Gated runtime responds 401 without token, 200 with token; chat replies; sign-out returns to sign-in card.',
    failCriteria: 'Connection error in chat or sign in/out fails.',
    notes: 'Uses gated Copilot Runtime with onRequest hook and authorization header forwarding.',
  },
  subagents: {
    instruction: "Send 'Research, write, and critique a short paragraph on solar panels.'",
    passCriteria: 'Cards appear as subagents run; delegation log on left grows to three entries.',
    failCriteria: 'Cards render but delegation log stays empty.',
    notes: 'Requires supervisor running on port 8001 (backend/subagents/main.py).',
  },
};

/**
 * Visual on-camera error note and structured error reporting.
 */
export async function handleTakeError(
  page: Page,
  config: PageRecordConfig,
  error: any,
  ctx: ActionContext,
): Promise<void> {
  const errMsg = error?.message || String(error);
  const spec = TRY_IT_MAP[config.id] || {
    instruction: config.prompt,
    passCriteria: 'Demo completes successfully.',
    failCriteria: 'Error or timeout occurs.',
    notes: 'Check service logs and connectivity.',
  };

  console.error(`\n🚨 [AUTORECORDER ERROR CAPTURED]: ${config.name} (${config.id})`);
  console.error(`   Error details: ${errMsg}`);
  console.error(`   Try It Test:   ${spec.instruction}`);
  console.error(`   Expected:      ${spec.passCriteria}`);
  console.error(`   Notes:         ${spec.notes}\n`);

  try {
    // Open Notepad overlay on screen so the error video clearly documents the failure
    await openNotepadWindow(page, `ERROR-REPORT-${config.id}.txt`, {
      left: '32px',
      top: '90px',
      width: '680px',
      height: '440px',
      transform: 'none',
    });

    const lines = [
      `=== [ERROR REPORT] ===`,
      `Page: ${config.name} (${config.id})`,
      `Route: /${config.route}/demo`,
      `Time:  ${new Date().toISOString()}`,
      `----------------------------------------------------`,
      `TESTED (from <ui-try-it>):`,
      `  ${spec.instruction}`,
      ``,
      `EXPECTED RESULT (Pass):`,
      `  ${spec.passCriteria}`,
      ``,
      `ACTUAL OUTCOME (Fail):`,
      `  ${errMsg.split('\n')[0].slice(0, 75)}`,
      ``,
      `REPORTING NOTES / REMEDIATION:`,
      `  ${spec.notes}`,
    ];

    await typeInNotepad(page, lines, 360, 260);
    // Dwell for 3.5 seconds so the video captures the error note cleanly
    await sleep(3500);
  } catch (notepadErr) {
    console.warn(`   Could not display on-camera error Notepad: ${notepadErr}`);
  }
}

/**
 * Writes a Markdown error report file summarizing any failing or warned takes.
 */
export function writeMarkdownErrorReport(
  results: Array<{
    id: string;
    name: string;
    filename: string;
    success: boolean;
    durationSec: number;
    error?: string;
    warnings: string[];
  }>,
  videosDir: string,
): string {
  const failed = results.filter((r) => !r.success);
  const warned = results.filter((r) => r.success && r.warnings.length > 0);

  const reportPath = join(videosDir, 'ERROR_REPORT.md');
  mkdirSync(videosDir, { recursive: true });

  const md: string[] = [
    `# Autorecorder Execution & Error Report`,
    ``,
    `- **Generated:** ${new Date().toISOString()}`,
    `- **Total Pages:** ${results.length}`,
    `- **Passed:** ${results.length - failed.length}`,
    `- **Failed:** ${failed.length}`,
    `- **With Notes:** ${warned.length}`,
    ``,
  ];

  if (failed.length === 0) {
    md.push(`## ✅ All Pages Passed!`, `No critical failures were encountered.`, ``);
  } else {
    md.push(`## ❌ Failed Pages Summary`, ``);
    for (const f of failed) {
      const spec = TRY_IT_MAP[f.id];
      md.push(`### ${f.name} (\`${f.id}\`)`);
      md.push(`- **Video Recorded:** \`${f.filename || '(no video)'}\``);
      md.push(`- **Duration:** ${f.durationSec}s`);
      md.push(`- **Error:** ${f.error || 'Unknown error'}`);
      if (spec) {
        md.push(`- **Try It Instruction:** ${spec.instruction}`);
        md.push(`- **Expected (Pass):** ${spec.passCriteria}`);
        md.push(`- **Failure Condition:** ${spec.failCriteria}`);
        md.push(`- **Troubleshooting Notes:** ${spec.notes}`);
      }
      if (f.warnings.length > 0) {
        md.push(`- **Warnings:**`);
        for (const w of f.warnings) md.push(`  - ${w}`);
      }
      md.push(``);
    }
  }

  if (warned.length > 0) {
    md.push(`## ⚠️ Warnings & Findings Notes`, ``);
    for (const w of warned) {
      const spec = TRY_IT_MAP[w.id];
      md.push(`### ${w.name} (\`${w.id}\`)`);
      md.push(`- **Video:** \`${w.filename}\``);
      if (spec) md.push(`- **Context Notes:** ${spec.notes}`);
      for (const note of w.warnings) {
        md.push(`- **Finding:** ${note}`);
      }
      md.push(``);
    }
  }

  writeFileSync(reportPath, md.join('\n'), 'utf8');
  return reportPath;
}

