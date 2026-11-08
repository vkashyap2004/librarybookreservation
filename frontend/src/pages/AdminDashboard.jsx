import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, CalendarCheck, Clock, BookCheck, BookX, PackageCheck, AlarmClock, IndianRupee } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';
import { PageLoader, EmptyState } from '../components/Feedback.jsx';
import ReservationTable from '../components/ReservationTable.jsx';
import { fmtMoney } from '../utils/format.js';

export default function AdminDashboard() {
  const toast = useToast();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get('/stats/admin').then((res) => setS(res.data.data)).catch((e) => toast.error(errorMessage(e)));
  }, []);

  if (!s) return <PageLoader />;

  const tiles = [
    [BookOpen, 'Total books', s.totalBooks],
    [Users, 'Registered students', s.totalStudents],
    [CalendarCheck, 'Total reservations', s.totalReservations],
    [Clock, 'Active reservations', s.activeReservations],
    [BookCheck, 'Available books', s.availableBooks],
    [BookX, 'Unavailable books', s.unavailableBooks],
    [PackageCheck, 'Approved, awaiting pickup', s.awaitingPickup],
    [AlarmClock, 'Overdue books', s.overdueBooks],
    [IndianRupee, 'Unpaid fines', fmtMoney(s.unpaidFines)],
  ];
  const shelfPct = s.totalCopies ? Math.round((s.availableCopies / s.totalCopies) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">Librarian dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/books/new" className="btn-gold">Add a book</Link>
          <Link to="/admin/books" className="btn-ghost">Book inventory</Link>
        </div>
      </div>

      {s.pendingReservations > 0 && (
        <Link to="/admin/reservations?status=Pending" className="mt-6 block rounded-lg border border-gold bg-gold-soft px-4 py-3 text-sm text-gold-dark hover:bg-gold-soft/70">
          {s.pendingReservations} {s.pendingReservations === 1 ? 'reservation is' : 'reservations are'} waiting for your decision. Review them now.
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="panel mt-6 p-5">
        <div className="flex items-baseline justify-between text-sm">
          <h2 className="font-serif text-xl">Copies on the shelf</h2>
          <span className="text-navy/65">{s.availableCopies} of {s.totalCopies} copies available ({shelfPct}%)</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-parchment" role="img" aria-label={`${shelfPct}% of copies available`}>
          <div className="h-full bg-sage" style={{ width: `${shelfPct}%` }} />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-2xl">Recent reservations</h2>
        <Link to="/admin/reservations" className="text-sm text-gold-dark underline">Manage all</Link>
      </div>
      <div className="mt-4">
        {s.recent.length === 0 ? <EmptyState title="No reservations yet" message="Student reservations will appear here." /> : <ReservationTable rows={s.recent} showStudent />}
      </div>
    </div>
  );
}
