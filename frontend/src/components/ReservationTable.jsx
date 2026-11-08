import { Link } from 'react-router-dom';
import { ReservationStatus } from './BookParts.jsx';
import { fmtDate, fmtMoney } from '../utils/format.js';

// One line of plain-English detail for each stage of a reservation
export function ReservationDetail({ r }) {
  switch (r.status) {
    case 'Pending': return 'Waiting for the librarian';
    case 'Approved': return `Collect by ${fmtDate(r.pickupDeadline)}`;
    case 'Collected':
      return r.overdueDays > 0
        ? <span className="font-medium text-brick">Was due {fmtDate(r.dueDate)}. {r.overdueDays} {r.overdueDays === 1 ? 'day' : 'days'} late, fine so far {fmtMoney(r.fine)}</span>
        : `Due back ${fmtDate(r.dueDate)}`;
    case 'Returned':
      return r.fineAmount > 0
        ? <span>Returned {fmtDate(r.returnedAt)}. Fine {fmtMoney(r.fineAmount)} <span className={r.finePaid ? 'text-sage' : 'font-medium text-brick'}>({r.finePaid ? 'paid' : 'unpaid'})</span></span>
        : `Returned ${fmtDate(r.returnedAt)} on time`;
    case 'Cancelled': return `Cancelled on ${fmtDate(r.cancellationDate)}`;
    case 'Rejected': return `Rejected on ${fmtDate(r.reviewedAt)}`;
    case 'Expired': return `Not collected by ${fmtDate(r.pickupDeadline)}`;
    default: return '-';
  }
}

// Shared table used by History (student) and Manage Reservations (admin)
export default function ReservationTable({ rows, showStudent = false, renderActions }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-navy/10 bg-parchment text-navy/70">
          <tr>
            <th className="px-4 py-3 font-medium">Reservation ID</th>
            <th className="px-4 py-3 font-medium">Book</th>
            {showStudent && <th className="px-4 py-3 font-medium">Student</th>}
            <th className="px-4 py-3 font-medium">Reserved on</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Details</th>
            {renderActions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-b border-navy/5 last:border-0">
              <td className="px-4 py-3 font-medium">{r.reservationId}</td>
              <td className="px-4 py-3">
                {r.bookId ? (
                  <Link to={`/books/${r.bookId._id}`} className="hover:text-gold-dark">
                    <span className="block font-medium">{r.bookId.title}</span>
                    <span className="text-navy/60">{r.bookId.author}</span>
                  </Link>
                ) : <span className="text-navy/50">Book removed from catalogue</span>}
              </td>
              {showStudent && (
                <td className="px-4 py-3">
                  {r.userId ? (
                    <>
                      <span className="block font-medium">{r.userId.name}</span>
                      <span className="text-navy/60">{r.userId.usn}</span>
                    </>
                  ) : '-'}
                </td>
              )}
              <td className="px-4 py-3">{fmtDate(r.reservationDate)}</td>
              <td className="px-4 py-3"><ReservationStatus r={r} /></td>
              <td className="px-4 py-3 text-navy/70"><ReservationDetail r={r} /></td>
              {renderActions && <td className="px-4 py-3 text-right">{renderActions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Row of filter buttons shared by several pages
export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {options.map((o) => (
        <button key={o} role="tab" aria-selected={value === o} onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${value === o ? 'border-navy bg-navy text-paper' : 'border-navy/20 bg-surface hover:bg-parchment'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
