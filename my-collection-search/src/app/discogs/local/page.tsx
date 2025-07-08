import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getLocalReleases() {
  const dir = path.resolve(process.cwd(), 'discogs_exports');
  let releases = [];
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    releases = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        return {
          id: data.id,
          title: data.title,
          year: data.year,
          artists: data.artists,
          labels: data.labels
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
  return releases;
}

export default async function DiscogsLocalReleasesPage() {
  const releases = await getLocalReleases();
  if (!releases) return notFound();
  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <h1>Local Discogs Releases</h1>
      <p>Total local releases: <b>{releases.length}</b></p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Release ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Artist</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Title</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Year</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Label</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.artists && r.artists.map(a => a.name).join(', ')}</td>
              <td>{r.title}</td>
              <td>{r.year}</td>
              <td>{r.labels && r.labels.map(l => l.name).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
