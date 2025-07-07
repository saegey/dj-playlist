// pages/api/discogs/sync.js
// Next.js API route to sync Discogs collection, only downloading new releases

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'discogs_exports');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const DISCOGS_USER_TOKEN = process.env.DISCOGS_USER_TOKEN;
const USERNAME = process.env.DISCOGS_USERNAME;
const FOLDER_ID = process.env.DISCOGS_FOLDER_ID || 0; // 0 means "All" folder

async function getCollectionPage(page, perPage = 100) {
  const url = `https://api.discogs.com/users/${USERNAME}/collection/folders/${FOLDER_ID}/releases?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Discogs token=${DISCOGS_USER_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Error fetching collection page ${page}: ${res.status}`);
  return res.json();
}

async function getReleaseDetails(releaseId) {
  const url = `https://api.discogs.com/releases/${releaseId}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Discogs token=${DISCOGS_USER_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Error fetching release ${releaseId}: ${res.status}`);
  return res.json();
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    const data = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(data);
    return manifest.releaseIds || [];
  }
  return [];
}

function saveManifest(releaseIds) {
  const manifest = {
    releaseIds: Array.from(new Set(releaseIds)),
    lastSynced: new Date().toISOString(),
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function POST(request) {
  if (!DISCOGS_USER_TOKEN || !USERNAME) {
    return new Response(JSON.stringify({ error: 'Discogs credentials not set in environment' }), { status: 500 });
  }
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  let page = 1;
  const perPage = 100;
  let allIds = [];
  let newReleases = [];
  let errors = [];

  // Load existing manifest
  let manifestIds = loadManifest();
  console.log('[Discogs Sync] Loaded manifest IDs:', manifestIds.length);

  try {
    // Step 1: Collect all collection release IDs
    while (true) {
      console.log(`[Discogs Sync] Fetching collection page ${page}...`);
      const collectionPage = await getCollectionPage(page, perPage);
      const releases = collectionPage.releases || [];
      console.log(`[Discogs Sync] Page ${page} - releases found: ${releases.length}`);
      if (releases.length === 0) break;

      for (const release of releases) {
        const releaseId = release.basic_information.id;
        allIds.push(releaseId);
        console.log(`[Discogs Sync] Found release ID: ${releaseId}`);
      }

      if (collectionPage.pagination.page < collectionPage.pagination.pages) {
        page += 1;
      } else {
        break;
      }
    }

    // Step 2: Determine new IDs not in manifest
    const newIds = allIds.filter(id => !manifestIds.includes(id));
    console.log(`[Discogs Sync] New IDs to fetch: ${newIds.length}`);

    // Step 3: Fetch and save details for new IDs only
    for (const releaseId of newIds) {
      console.log(`[Discogs Sync] Fetching details for release ID: ${releaseId}`);
      try {
        const details = await getReleaseDetails(releaseId);
        const filePath = path.join(OUTPUT_DIR, `release_${releaseId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(details, null, 2));
        newReleases.push(releaseId);
        console.log(`[Discogs Sync] Saved release ID: ${releaseId}`);
      } catch (e) {
        errors.push({ releaseId, error: e.message });
        console.log(`[Discogs Sync] Error for release ID ${releaseId}: ${e.message}`);
      }

      // Wait to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1200));
    }

    // Step 4: Update and save manifest
    saveManifest([...manifestIds, ...newIds]);
    console.log(`[Discogs Sync] Manifest updated. Total IDs: ${manifestIds.length + newIds.length}`);

    return new Response(JSON.stringify({
      message: 'Sync complete',
      newReleases,
      alreadyHave: manifestIds,
      errors,
      totalCollection: allIds.length,
      newCount: newReleases.length,
    }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, newReleases, errors }), { status: 500 });
  }
}