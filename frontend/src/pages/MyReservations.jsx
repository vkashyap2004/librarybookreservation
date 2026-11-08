import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';
import { BookCover, ReservationStatus } from '../components/BookParts.jsx';
import { ReservationDetail } from '../components/ReservationTable.jsx';
import { ConfirmModal, EmptyState, PageLoader } from '../components/Feedback.jsx';
import { fmtDate } from '../utils/format.js';

export default function MyReservations() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null); // reservation waiting for cancel confirmation
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/reservations/my', { params: { active: true } })
      .then((res) => setItems(res.data.data.reservations))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.put(`/reservations/${target._id}/cancel`);
      toast.success(`Reservation ${target.reservationId} cancelled. The copy is available again.`);
      setTarget(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
      setTarget(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl">My reservations</h1>
        <Link to="/history" className="text-sm text-gold-dark underline">View full history</Link>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState title="Nothing reserved right now" message="Active reservations show up here, and you can hold up to 3 at a time. Approved books must be collected within 3 days." action={<Link to="/books" className="btn-primary">Browse books</Link>} />
        ) : (
          <ul className="space-y-4">
            {items.map((r) => (
              <li key={r._id} className="panel flex flex-wrap items-center gap-4 p-4">
                {r.bookId ? <BookCover book={r.bookId} className="h-24 w-16 shrink-0 rounded" /> : <div className="h-24 w-16 shrink-0 rounded bg-parchment" />}
                <div className="min-w-0 flex-1">
                  <Link to={r.bookId ? `/books/${r.bookId._id}` : '#'} className="font-serif text-xl hover:text-gold-dark">{r.bookId?.title || 'Book removed'}</Link>
                  <p className="text-sm text-navy/65">{r.bookId?.author}</p>
                  <p className="mt-1 text-sm text-navy/65">{r.reservationId} · Reserved {fmtDate(r.reservationDate)}</p>
                  <p className="mt-1 text-sm"><ReservationDetail r={r} /></p>
                </div>
                <ReservationStatus r={r} />
                {r.status === 'Collected'
                  ? <span className="max-w-[10rem] text-xs text-navy/60">Return it at the library desk</span>
                  : <button className="btn-ghost text-brick" onClick={() => setTarget(r)}>Cancel reservation</button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal open={!!target} danger busy={busy} title="Cancel this reservation?"
        message={target ? `"${target.bookId?.title}" will be released for other students. It stays in your history.` : ''}
        confirmLabel="Cancel reservation" onConfirm={cancel} onCancel={() => setTarget(null)} />
    </div>
  );
}
