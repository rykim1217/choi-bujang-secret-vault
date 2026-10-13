import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASELINE_DIR = join(ROOT, 'policy-baseline');
const SOURCE_COMMIT = 'f780b661665ad8a33c134035acf06699e46b8f0f';
const SCHEMA = 'aleph.practice.policy-baseline.v1';

const TARGET_FILES = Object.freeze([
  'src/decider.mjs',
  'src/detect.mjs',
  'src/resource-policy.mjs',
  'src/resource-access.mjs',
  'aleph.config.json',
  'docs/DECIDER_REQUEST.md',
  'docs/DETECT_EVENTS.md',
]);

const VERIFICATION_COMMANDS = Object.freeze([
  { label: 'test:r5', display: 'npm run test:r5', command: process.execPath,
    args: ['--test', 'test/r5.test.mjs'] },
  { label: 'test:package', display: 'npm run test:package', command: process.execPath,
    args: ['--test', 'test/package-starter.test.mjs'] },
  { label: 'stage8-resource-policy', command: process.execPath,
    args: ['--test', 'test/stage8-resource-policy.test.mjs'] },
  { label: 'xdr-run-temporary-test', command: process.execPath,
    args: ['--test', 'test/xdr-run.test.mjs'] },
  { label: 'decider:test', display: 'npm run decider:test', command: process.execPath,
    args: ['scripts/decider-test.mjs'] },
  { label: 'fixture:7', display: 'npm run fixture:7', command: process.execPath,
    args: ['scripts/fixture-7.mjs'] },
  { label: 'detect:test', display: 'npm run detect:test', command: process.execPath,
    args: ['scripts/detect-test.mjs'] },
]);

function commandExecutable(command) {
  return process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
}

function runGit(args, options = {}) {
  return execFileSync('git', args, { cwd: ROOT, ...options });
}

function sourceBytes(path, commit = SOURCE_COMMIT) {
  return runGit(['show', `${commit}:${path}`]);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sameBytes(left, right) {
  return Buffer.compare(left, right) === 0;
}

function normalizedText(bytes) {
  return bytes.toString('utf8').replaceAll('\r\n', '\n');
}

function sameNormalizedText(left, right) {
  return normalizedText(left) === normalizedText(right);
}

function gitWorkingTreeMatches(path) {
  try {
    runGit(['diff', '--quiet', SOURCE_COMMIT, '--', path]);
    return true;
  } catch {
    return false;
  }
}

function commandText(spec) {
  return spec.display ?? [spec.command, ...spec.args].join(' ');
}

function observedSummary(output, label) {
  const testCount = output.match(/ℹ tests (\d+)/u)?.[1];
  const passCount = output.match(/ℹ pass (\d+)/u)?.[1];
  if (testCount && passCount) return `${passCount}/${testCount} checks passed`;

  const passedLines = (output.match(/^통과(?: ·|:)/gmu) ?? []).length;
  if (passedLines) return `${passedLines} practice checks passed`;
  if (label === 'fixture:7' && /정상 사건: allow/u.test(output)
      && /복합 이상 사건: step_up/u.test(output)) {
    return 'normal allow and compound anomaly step_up observed';
  }
  return 'completed with exit code 0';
}

function runVerification() {
  const results = VERIFICATION_COMMANDS.map((spec) => {
    const result = spawnSync(commandExecutable(spec.command), spec.args, {
      cwd: ROOT,
      encoding: 'utf8',
      windowsHide: true,
    });
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const passed = !result.error && result.status === 0;
    return {
      command: commandText(spec),
      status: passed ? 'passed' : 'failed',
      exitCode: result.status ?? null,
      summary: passed ? observedSummary(output, spec.label) : 'command failed',
      localPracticeOnly: true,
    };
  });
  return { allPassed: results.every((item) => item.status === 'passed'), results };
}

async function currentSourceFiles() {
  const files = [];
  for (const path of TARGET_FILES) {
    const current = await readFile(join(ROOT, path));
    const source = sourceBytes(path);
    files.push({
      path,
      current,
      source,
      currentSha256: sha256(current),
      sourceSha256: sha256(source),
      matchesSourceCommit: gitWorkingTreeMatches(path),
    });
  }
  return files;
}

function assertSourceMatches(files) {
  const mismatches = files.filter((file) => !file.matchesSourceCommit);
  if (mismatches.length) {
    const details = mismatches.map((file) =>
      `${file.path}: current=${file.currentSha256} source=${file.sourceSha256}`).join('; ');
    throw new Error(`source_commit_mismatch: ${details}`);
  }
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function manifestFor(files, verification) {
  return {
    schema: SCHEMA,
    purpose: 'training_only',
    status: 'candidate',
    source: {
      repository: 'https://github.com/rykim1217/choi-bujang-secret-vault',
      commit: SOURCE_COMMIT,
      ref: 'main',
      currentFilesMatchCommit: true,
      historicalOperationalBackup: false,
    },
    files: files.map((file) => ({
      path: file.path,
      baselinePath: file.path,
      sourceCommit: SOURCE_COMMIT,
      sha256: file.sourceSha256,
      sourceCommitSha256: file.sourceSha256,
      workingTreeSha256: file.currentSha256,
      comparison: 'git-normalized-content',
      bytes: file.source.byteLength,
      workingTreeBytes: file.current.byteLength,
    })),
    verification: {
      executedAt: new Date().toISOString(),
      allPassed: verification.allPassed,
      localPracticeOnly: true,
      liveOperationsExecuted: false,
      results: verification.results,
    },
    restore: {
      supported: true,
      performed: false,
      operationalPolicyChanged: false,
      dataChanged: false,
      auditRecordsChanged: false,
    },
  };
}

async function verifyBaselineDirectory(directory = BASELINE_DIR) {
  if (!(await pathExists(directory))) throw new Error('baseline_missing');

  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  } catch {
    throw new Error('baseline_manifest_missing_or_invalid');
  }

  if (manifest?.schema !== SCHEMA || manifest.purpose !== 'training_only'
      || manifest.status !== 'candidate') {
    throw new Error('baseline_manifest_contract_invalid');
  }
  if (manifest.source?.commit !== SOURCE_COMMIT
      || manifest.source?.historicalOperationalBackup !== false) {
    throw new Error('baseline_source_invalid');
  }
  if (manifest.verification?.allPassed !== true
      || manifest.verification?.localPracticeOnly !== true
      || manifest.verification?.liveOperationsExecuted !== false) {
    throw new Error('baseline_verification_invalid');
  }

  const entries = manifest.files;
  if (!Array.isArray(entries) || entries.length !== TARGET_FILES.length
      || entries.map((entry) => entry.path).sort().join('\n') !== [...TARGET_FILES].sort().join('\n')) {
    throw new Error('baseline_file_scope_invalid');
  }

  for (const entry of entries) {
    if (entry.sourceCommit !== SOURCE_COMMIT || entry.baselinePath !== entry.path) {
      throw new Error(`baseline_manifest_file_invalid: ${entry.path}`);
    }
    if (entry.comparison !== 'git-normalized-content'
        || entry.sourceCommitSha256 !== entry.sha256) {
      throw new Error(`baseline_manifest_hash_metadata_invalid: ${entry.path}`);
    }
    const bytes = await readFile(join(directory, entry.baselinePath));
    if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
      throw new Error(`baseline_hash_mismatch: ${entry.path}`);
    }
    if (!sameBytes(bytes, sourceBytes(entry.path, entry.sourceCommit))) {
      throw new Error(`baseline_source_content_mismatch: ${entry.path}`);
    }
  }
  return manifest;
}

function jsonValue(value) {
  return JSON.stringify(value);
}

function collectJsonDiffs(before, after, path = '') {
  if (Object.is(before, after)) return [];
  const beforeObject = before && typeof before === 'object';
  const afterObject = after && typeof after === 'object';
  if (!beforeObject || !afterObject || Array.isArray(before) || Array.isArray(after)) {
    return [{ item: path || '/', before: jsonValue(before), after: jsonValue(after) }];
  }

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return keys.flatMap((key) => collectJsonDiffs(before[key], after[key], `${path}/${key}`));
}

function collectTextDiffs(beforeText, afterText) {
  const before = beforeText.split(/\r?\n/u);
  const after = afterText.split(/\r?\n/u);
  const rows = Array.from({ length: before.length + 1 }, () =>
    new Uint16Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      rows[i][j] = before[i] === after[j]
        ? rows[i + 1][j + 1] + 1
        : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }

  const changes = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      i += 1;
      j += 1;
    } else if (i < before.length && (j === after.length || rows[i + 1][j] >= rows[i][j + 1])) {
      changes.push({ item: `line ${i + 1}`, before: before[i], after: null });
      i += 1;
    } else {
      changes.push({ item: `line ${i + 1}`, before: null, after: after[j] });
      j += 1;
    }
  }
  return changes;
}

async function compareCurrentPolicy(manifest) {
  const differences = [];
  for (const entry of manifest.files) {
    const current = await readFile(join(ROOT, entry.path));
    const currentSha256 = sha256(current);
    const baselineBytes = await readFile(join(BASELINE_DIR, entry.baselinePath));
    if (sameNormalizedText(current, baselineBytes)) continue;

    const baseline = baselineBytes.toString('utf8');
    const currentText = current.toString('utf8');
    let items;
    if (entry.path.endsWith('.json')) {
      items = collectJsonDiffs(JSON.parse(baseline), JSON.parse(currentText));
    } else {
      items = collectTextDiffs(baseline, currentText);
    }
    differences.push({
      path: entry.path,
      baselineSha256: entry.sha256,
      currentSha256,
      items,
    });
  }
  return differences;
}

function restorePlan(manifest, differences) {
  return {
    baseline: 'verified',
    targetVersion: manifest.source.commit,
    restoreScope: 'training_policy_only',
    restorePreview: true,
    restorePerformed: false,
    confirmationRequired: differences.length > 0,
    changedFiles: differences.map((item) => item.path),
    changedItems: differences,
    operationalPolicyChanged: false,
    supabaseChanged: false,
    vercelChanged: false,
    dataChanged: false,
    auditRecordsChanged: false,
  };
}

async function runPostRestoreCheck() {
  const result = spawnSync(process.execPath, ['scripts/policy-restore-check.mjs', '--post-restore'], {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`post_restore_local_check_failed: ${result.stderr?.trim() || 'unknown_error'}`);
  }
  return JSON.parse(result.stdout);
}

async function restoreChangedFiles(manifest, differences) {
  const restoredFiles = [];
  for (const difference of differences) {
    const destination = join(ROOT, difference.path);
    const baseline = await readFile(join(BASELINE_DIR, difference.path));
    const current = await readFile(destination);
    if (sameNormalizedText(current, baseline)) continue;

    const temporaryDirectory = await mkdtemp(join(dirname(destination), '.policy-restore-'));
    const temporaryFile = join(temporaryDirectory, basename(destination));
    try {
      await writeFile(temporaryFile, baseline);
      await rename(temporaryFile, destination);
      restoredFiles.push(difference.path);
    } finally {
      if (await pathExists(temporaryDirectory)) {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    }
  }
  return restoredFiles;
}

async function createBaseline() {
  if (await pathExists(BASELINE_DIR)) throw new Error('baseline_already_exists');

  const files = await currentSourceFiles();
  assertSourceMatches(files);
  const verification = runVerification();
  if (!verification.allPassed) {
    const failed = verification.results
      .filter((item) => item.status !== 'passed')
      .map((item) => `${item.command} (exit ${item.exitCode ?? 'unknown'})`)
      .join('; ');
    throw new Error(`verification_failed: ${failed}`);
  }

  const manifest = manifestFor(files, verification);
  const temporaryDirectory = await mkdtemp(join(ROOT, '.policy-baseline-create-'));
  try {
    for (const file of files) {
      const destination = join(temporaryDirectory, file.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.source);
    }
    await writeFile(join(temporaryDirectory, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    await verifyBaselineDirectory(temporaryDirectory);
    await rename(temporaryDirectory, BASELINE_DIR);
    await verifyBaselineDirectory(BASELINE_DIR);
  } catch (error) {
    if (await pathExists(temporaryDirectory)) await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }

  process.stdout.write(`${JSON.stringify({
    created: true,
    directory: 'policy-baseline',
    sourceCommit: SOURCE_COMMIT,
    historicalOperationalBackup: false,
    hashVerification: 'passed',
    verification: manifest.verification,
    files: manifest.files,
  }, null, 2)}\n`);
}

async function compareBaseline() {
  const manifest = await verifyBaselineDirectory();
  const differences = await compareCurrentPolicy(manifest);
  process.stdout.write(`${JSON.stringify(restorePlan(manifest, differences), null, 2)}\n`);
}

async function restoreBaseline() {
  const manifest = await verifyBaselineDirectory();
  const differences = await compareCurrentPolicy(manifest);
  const plan = restorePlan(manifest, differences);
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  if (!differences.length) {
    process.stdout.write('복원할 변경 항목이 없어 실제 쓰기를 실행하지 않습니다.\n');
    return;
  }

  if (process.argv[3] !== '--confirm' || process.argv[4] !== manifest.source.commit) {
    throw new Error(`confirmation_required: --confirm ${manifest.source.commit}`);
  }
  const { createInterface } = await import('node:readline/promises');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  let answer;
  try {
    answer = await prompt.question('위 미리보기의 시험 정책 파일만 복원하려면 RESTORE를 입력하세요: ');
  } finally {
    prompt.close();
  }
  if (answer.trim() !== 'RESTORE') throw new Error('confirmation_rejected');

  const restoredFiles = await restoreChangedFiles(manifest, differences);
  const verifiedManifest = await verifyBaselineDirectory();
  const remaining = await compareCurrentPolicy(verifiedManifest);
  if (remaining.length) throw new Error('post_restore_policy_diff_remains');
  const postRestoreCheck = await runPostRestoreCheck();
  process.stdout.write(`${JSON.stringify({
    ...plan,
    restorePerformed: true,
    restoredFiles,
    postRestoreCheck,
  }, null, 2)}\n`);
}

async function main() {
  const mode = process.argv[2];
  if (mode === 'create') return createBaseline();
  if (mode === 'compare') return compareBaseline();
  if (mode === 'restore-preview') return compareBaseline();
  if (mode === 'restore') return restoreBaseline();
  throw new Error('usage: npm run policy:baseline -- <create|compare|restore-preview|restore>');
}

try {
  await main();
} catch (error) {
  process.stderr.write(`정책 기준본 작업 중단: ${error instanceof Error ? error.message : 'unknown_error'}\n`);
  process.exitCode = 1;
}
