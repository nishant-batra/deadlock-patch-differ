// app/server/patchService.ts
import fs from 'fs';
import path from 'path';

export async function getLatestPatchDiff() {
  const DATA_DIR = path.join(process.cwd(), 'app', 'data');
  const diffPath = path.join(DATA_DIR, 'latest-diff.json');
  const versionPath = path.join(DATA_DIR, 'version.txt');

  if (!fs.existsSync(diffPath) || !fs.existsSync(versionPath)) {
    throw new Error('Waiting for enough patch data to generate a diff.');
  }

  // Just read the pre-computed files
  const diffPayload = JSON.parse(fs.readFileSync(diffPath, 'utf8'));
  const version = fs.readFileSync(versionPath, 'utf8');

  return {
    oldVersion: 'Previous Patch',
    newVersion: version,
    diff: diffPayload
  };
}