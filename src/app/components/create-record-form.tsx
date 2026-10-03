'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type ApiError = {
  error?: string;
};

async function readError(response: Response): Promise<string> {
  const responseText = await response.text();
  if (responseText) {
    try {
      const body = JSON.parse(responseText) as ApiError;
      if (body.error) return body.error;
    } catch {
      // Fall through to a status-based message for non-JSON responses.
    }
  }
  return `Create failed (${response.status} ${response.statusText || 'request error'}).`;
}

export function CreateRecordForm() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a record name.');
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
      if (!response.ok) throw new Error(await readError(response));
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the record. Try again.');
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
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
