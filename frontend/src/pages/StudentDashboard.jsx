import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, Ban, Search, IndianRupee, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageLoader, EmptyState } from '../components/Feedback.jsx';
import { BookCover, ReservationStatus } from '../components/BookParts.jsx';
import { ReservationDetail } from '../components/ReservationTable.jsx';
import { fmtDate, fmtMoney } from '../utils/format.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/stats/student').then((res) => setStats(res.data.data)).catch((e) => toast.error(errorMessage(e)));
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/books?search=${encodeURIComponent(query)}`);
  };

  if (!stats) return <PageLoader />;

  const tiles = [
    [CalendarCheck, 'Total reservations', stats.total],
    [Clock, 'Active reservations', stats.active],
    [Ban, 'Cancelled', stats.cancelled],
    [IndianRupee, 'Outstanding fines', fmtMoney(stats.fines)],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Welcome, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-navy/65">{user.usn} · {user.department}</p>

      {(stats.overdue > 0 || stats.fines > 0) && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-brick/40 bg-brick/10 px-4 py-3 text-sm text-brick" role="alert">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>
            {stats.overdue > 0 ? `You have ${stats.overdue} overdue ${stats.overdue === 1 ? 'book' : 'books'}. ` : ''}
            {stats.fines > 0 ? `Outstanding fine: ${fmtMoney(stats.fines)}. ` : ''}
            New reservations are paused until you return the book and pay the fine at the library desk.
          </span>
        </div>
      )}

      <form onSubmit={search} className="mt-6 flex max-w-xl gap-2">
        <input className="input" placeholder="Search by title, author or ISBN" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Quick book search" />
        <button className="btn-primary"><Search size={16} /> Search</button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([Icon, label, value]) => (
          <div key={label} className="panel flex items-center gap-4 p-5">
            <Icon className="text-gold" />
            <div>
              <p className="font-serif text-3xl leading-none">{value}</p>
              <p className="mt-1 text-sm text-navy/65">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-2xl">Recent activity</h2>
        <Link to="/books" className="btn-gold">Browse the library</Link>
      </div>

      <div className="mt-4">
        {stats.recent.length === 0 ? (
          <EmptyState title="No reservations yet" message="Find a book you need and reserve a copy." action={<Link to="/books" className="btn-primary">Browse books</Link>} />
        ) : (
          <ul className="panel divide-y divide-navy/10">
            {stats.recent.map((r) => (
              <li key={r._id} className="flex items-center gap-4 p-4">
                {r.bookId ? <BookCover book={r.bookId} className="h-16 w-12 shrink-0 rounded" /> : <div className="h-16 w-12 shrink-0 rounded bg-parchment" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.bookId?.title || 'Book removed from catalogue'}</p>
                  <p className="text-sm text-navy/60">Reserved {fmtDate(r.reservationDate)}</p>
                  <p className="text-sm text-navy/60"><ReservationDetail r={r} /></p>
                </div>
                <ReservationStatus r={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
