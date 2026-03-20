// scripts/ingestPatch.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import stringify from 'fast-json-stable-stringify';
import { generateDeadlockPatchDiff } from '../app/utils/diffEngine'; // Import the engine

const DATA_DIR = path.join(process.cwd(), 'app', 'data');

async function ingestCurrentPatch() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created missing directory: ${DATA_DIR}`);
  }

  console.log('Fetching live item data from Deadlock API...');
  const response = await fetch('https://assets.deadlock-api.com/v2/items');
  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }
  const itemsData = await response.json();

  const newDataHash = crypto.createHash('sha256').update(stringify(itemsData)).digest('hex');
  const latestHashPath = path.join(DATA_DIR, 'latest-hash.txt');

  if (fs.existsSync(latestHashPath)) {
    const latestHash = fs.readFileSync(latestHashPath, 'utf8');
    if (latestHash === newDataHash) {
      console.log('No item changes detected since last run. Exiting.');
      return;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const timeSuffix = Date.now().toString().slice(-4);
  const patchId = `patch-${today}-${timeSuffix}`;

  const latestDataPath = path.join(DATA_DIR, 'latest-patch.json');
  const previousDataPath = path.join(DATA_DIR, 'previous-patch.json');
  const diffDataPath = path.join(DATA_DIR, 'latest-diff.json'); // New file

  // Read the CURRENT latest data to act as our baseline before we overwrite it
  let previousData = [];
  if (fs.existsSync(latestDataPath)) {
    previousData = JSON.parse(fs.readFileSync(latestDataPath, 'utf8'));
    fs.renameSync(latestDataPath, previousDataPath);
  } else {
    fs.writeFileSync(previousDataPath, JSON.stringify([]));
  }

  // 🔥 CALCULATE THE DIFF AT BUILD TIME 🔥
  console.log('Calculating patch diff...');
  const patchDiff = generateDeadlockPatchDiff(previousData, itemsData);

  // Save all the files
  fs.writeFileSync(latestDataPath, JSON.stringify(itemsData, null, 2));
  fs.writeFileSync(diffDataPath, JSON.stringify(patchDiff, null, 2)); // Save the pre-computed diff
  fs.writeFileSync(latestHashPath, newDataHash);
  fs.writeFileSync(path.join(DATA_DIR, 'version.txt'), patchId);

  console.log(`✅ New patch (${patchId}) and diff successfully saved!`);
}

ingestCurrentPatch();