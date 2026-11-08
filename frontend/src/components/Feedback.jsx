import { Loader2, Inbox } from 'lucide-react';

export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin" />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-navy/60">
      <Spinner size={22} /> Loading
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-navy/20 bg-surface px-6 py-14 text-center">
      <Inbox size={32} className="text-gold" />
      <h3 className="mt-3 text-xl">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-navy/65">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-xl">
        <h3 className="text-xl">{title}</h3>
        <p className="mt-2 text-sm text-navy/70">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>Keep it</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
