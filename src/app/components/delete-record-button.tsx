'use client';

import { useState } from 'react';

type Feedback = {
  kind: 'success' | 'error';
  status: number;
  message: string;
};

export function DeleteRecordButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function remove() {
    if (!window.confirm('Delete this record?')) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/records/${id}`, { method: 'DELETE', headers: { accept: 'application/json' } });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setFeedback({ kind: 'error', status: response.status, message: body?.error ?? 'Delete failed.' });
        setBusy(false);
        return;
      }
      setFeedback({ kind: 'success', status: response.status, message: 'Record deleted. Refreshing the list…' });
      window.setTimeout(() => window.location.reload(), 350);
    } catch (cause) {
      setFeedback({ kind: 'error', status: 0, message: cause instanceof Error ? cause.message : 'Could not reach the app. Try again.' });
      setBusy(false);
    }
  }

  return <span><button className="danger" type="button" onClick={() => void remove()} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>{feedback && <span className={`inline-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.status ? `${feedback.status} ` : ''}{feedback.message}</span>}</span>;
}
