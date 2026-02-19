import { useRef, useState } from 'react';
import type { BossTable } from '../types';
import { exportState, importState } from '../utils/backup';

type BackupPanelProps = {
  tables: BossTable[];
  onReplaceTables: (tables: BossTable[]) => void;
  onMergeTables: (tables: BossTable[]) => void;
};

async function copyText(text: string, textarea: HTMLTextAreaElement | null): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (!textarea) {
    throw new Error('Copy unavailable');
  }

  textarea.focus();
  textarea.select();
  const ok = document.execCommand('copy');
  if (!ok) {
    throw new Error('Copy unavailable');
  }
}

export function BackupPanel({ tables, onReplaceTables, onMergeTables }: BackupPanelProps) {
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const exportRef = useRef<HTMLTextAreaElement>(null);

  const handleCopyBackup = async () => {
    setError('');
    const backupString = exportState(tables);
    setExportText(backupString);

    try {
      await copyText(backupString, exportRef.current);
      setMessage('Copied!');
    } catch {
      setMessage('Backup generated. Copy manually from the textarea.');
    }
  };

  const handleImportReplace = () => {
    setMessage('');
    setError('');

    try {
      const result = importState(importText);
      const ok = window.confirm('This will overwrite your current timers. Continue?');
      if (!ok) return;

      onReplaceTables(result.payload.tables);

      setMessage(
        result.warnings.length > 0
          ? `Imported with warnings: ${result.warnings.join(' ')}`
          : `Imported ${result.payload.tables.length} table(s).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup string');
    }
  };

  const handleMergeImport = () => {
    setMessage('');
    setError('');

    try {
      const result = importState(importText);
      onMergeTables(result.payload.tables);
      setMessage(
        result.warnings.length > 0
          ? `Merged with warnings: ${result.warnings.join(' ')}`
          : `Merged ${result.payload.tables.length} table(s).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup string');
    }
  };

  return (
    <section className="panel">
      <h2>Backup</h2>
      <div className="backup-grid">
        <div>
          <button onClick={handleCopyBackup}>Copy Backup</button>
          <label className="backup-label">
            Export String
            <textarea
              ref={exportRef}
              className="backup-textarea"
              value={exportText}
              readOnly
              placeholder={'Click "Copy Backup" to generate export string'}
            />
          </label>
        </div>

        <div>
          <label className="backup-label">
            Paste Backup Here
            <textarea
              className="backup-textarea"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Paste BOSSTIMER_V1:... or raw JSON"
            />
          </label>
          <div className="backup-actions">
            <button onClick={handleImportReplace}>Import</button>
            <button className="btn-ghost" onClick={handleMergeImport}>
              Merge Import
            </button>
          </div>
        </div>
      </div>

      {message && <p className="backup-message">{message}</p>}
      {error && <p className="backup-error">{error}</p>}
    </section>
  );
}
