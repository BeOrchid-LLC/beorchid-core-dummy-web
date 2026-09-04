'use client';

import { useState } from 'react';

export function DeleteRecordButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm('Delete this record?')) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/records/${id}`, { method: 'DELETE', headers: { accept: 'application/json' } });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? 'Delete failed.');
      }
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
      setBusy(false);
    }
  }

  return <span><button className="danger" type="button" onClick={() => void remove()} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>{error && <span className="muted"> {error}</span>}</span>;
}
