'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type ApiError = {
  error?: string;
};

type Feedback = {
  kind: 'success' | 'error';
  status: number;
  message: string;
};

async function readResponseMessage(response: Response, fallback: string): Promise<string> {
  const responseText = await response.text();
  if (responseText) {
    try {
      const body = JSON.parse(responseText) as ApiError;
      if (body.error) return body.error;
    } catch {
      // Fall through to a status-based message for non-JSON responses.
    }
  }
  return fallback;
}

export function CreateRecordForm() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ kind: 'error', status: 400, message: 'Enter a record name.' });
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const message = await readResponseMessage(response, `Create failed (${response.statusText || 'request error'}).`);
      if (!response.ok) {
        setFeedback({ kind: 'error', status: response.status, message });
        setBusy(false);
        return;
      }
      setFeedback({ kind: 'success', status: response.status, message: 'Record created. Refreshing the list…' });
      window.setTimeout(() => window.location.reload(), 350);
    } catch (cause) {
      setFeedback({ kind: 'error', status: 0, message: cause instanceof Error ? cause.message : 'Could not reach the app. Try again.' });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="row" style={{ marginBottom: '1.5rem' }} noValidate>
      <label className="muted" htmlFor="record-name">New record</label>
      <input
        id="record-name"
        type="text"
        name="name"
        maxLength={120}
        placeholder="Record name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={busy}
        required
      />
      <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create record'}</button>
      {feedback && <p className={`form-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}><strong>{feedback.status ? `${feedback.status} ` : ''}{feedback.kind === 'error' ? 'Request failed' : 'Created'}</strong> — {feedback.message}</p>}
    </form>
  );
}
