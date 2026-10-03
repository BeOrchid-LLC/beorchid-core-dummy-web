'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type Feedback = {
  kind: 'success' | 'error';
  status: number;
  message: string;
};

export function DeleteRecordForm() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const recordId = id.trim();
    if (!recordId) {
      setFeedback({ kind: 'error', status: 400, message: 'Enter a record ID to test delete authorization.' });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: { accept: 'application/json' },
      });
      const responseText = await response.text();
      let message = response.ok ? 'Record deleted. Refreshing the list…' : 'Delete failed.';
      if (responseText) {
        try {
          const body = JSON.parse(responseText) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Keep the status-based message for non-JSON responses.
        }
      }
      if (!response.ok) {
        setFeedback({ kind: 'error', status: response.status, message });
        setBusy(false);
        return;
      }
      setFeedback({ kind: 'success', status: response.status, message });
      window.setTimeout(() => window.location.reload(), 350);
    } catch (cause) {
      setFeedback({ kind: 'error', status: 0, message: cause instanceof Error ? cause.message : 'Could not reach the app. Try again.' });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="acceptance-form" noValidate>
      <label htmlFor="record-id">Delete test by record ID</label>
      <div className="row">
        <input id="record-id" type="text" placeholder="Paste an existing record UUID" value={id} onChange={(event) => setId(event.target.value)} disabled={busy} />
        <button className="danger" type="submit" disabled={busy}>{busy ? 'Testing…' : 'Test delete'}</button>
      </div>
      <p className="muted">Use an existing ID to verify delete authorization even when record reading is denied.</p>
      {feedback && <p className={`form-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}><strong>{feedback.status ? `${feedback.status} ` : ''}{feedback.kind === 'error' ? 'Request failed' : 'Deleted'}</strong> — {feedback.message}</p>}
    </form>
  );
}
