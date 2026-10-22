/**
 * Script for capturing terminal session casts if needed.
 */
import { captureCast, castText, writeCast } from '../actions/terminal';

export interface CastSpec {
  command: string;
  cwd: string;
  file: string;
  expect: RegExp;
  sources: string[];
  stopWhen: RegExp;
}

export const CASTS: Record<string, CastSpec> = {};

const wanted = process.argv.slice(2);
const entries = Object.entries(CASTS).filter(
  ([key]) => wanted.length === 0 || wanted.includes(key),
);

if (entries.length === 0) {
  console.log('No casts configured for this repository.');
  process.exit(0);
}

let failed = false;
for (const [key, spec] of entries) {
  console.log(`\n▶ ${key}: ${spec.command}`);
  const cast = await captureCast({
    command: spec.command,
    cwd: spec.cwd,
    title: 'Windows PowerShell',
    stopWhen: spec.stopWhen,
    graceMs: 1500,
    timeoutMs: 300_000,
  });
  const text = castText(cast);
  if (!spec.expect.test(text)) {
    console.error(`  ❌ did not match ${spec.expect}`);
    failed = true;
  } else {
    console.log(`  ✅ matched ${spec.expect}`);
  }
  writeCast(spec.file, cast);
}

if (failed) process.exit(1);
