"use client";

import { useState } from 'react';

export default function DiscogsSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/discogs', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState(null);
  const [indexError, setIndexError] = useState(null);

  const handleUpdateIndex = async () => {
    setIndexing(true);
    setIndexResult(null);
    setIndexError(null);
    try {
      const res = await fetch('/api/discogs/update-index', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setIndexResult(data);
    } catch (e) {
      setIndexError(e.message);
    } finally {
      setIndexing(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h1>Discogs Collection Sync</h1>
      <button onClick={handleSync} disabled={syncing || indexing} style={{ padding: '0.5em 1.5em', fontSize: '1.1em', marginRight: 12 }}>
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
      <button onClick={handleUpdateIndex} disabled={indexing || syncing} style={{ padding: '0.5em 1.5em', fontSize: '1.1em' }}>
        {indexing ? 'Updating Index…' : 'Update Index'}
      </button>
      {indexError && <div style={{ color: 'red', marginTop: 16 }}>Index Error: {indexError}</div>}
      {indexResult && (
        <div style={{ marginTop: 24 }}>
          <h2>Index Update Results</h2>
          <div>{indexResult.message}</div>
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 16 }}>Error: {error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>Sync Results</h2>
          <div><b>New releases downloaded:</b> {result.newReleases.length}</div>
          <div><b>Already present:</b> {result.alreadyHave.length}</div>
          <div><b>Total releases processed:</b> {result.total}</div>
          {result.errors && result.errors.length > 0 && (
            <div style={{ color: 'orange', marginTop: 12 }}>
              <b>Errors:</b>
              <ul>
                {result.errors.map((e, i) => (
                  <li key={i}>Release {e.releaseId}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
          {result.newReleases.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary>Show new release IDs</summary>
              <pre>{JSON.stringify(result.newReleases, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
