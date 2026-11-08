import { useState } from 'react';
import { Link } from 'react-router-dom';

// Book cover with a graceful fallback when the image URL is missing or broken
export function BookCover({ book, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (book?.coverImage && !failed) {
    return <img src={book.coverImage} alt={`Cover of ${book.title}`} onError={() => setFailed(true)} className={`object-cover ${className}`} loading="lazy" />;
  }
  const initials = (book?.title || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  return (
    <div className={`flex items-center justify-center bg-navy-800 font-serif text-3xl text-gold-light ${className}`} role="img" aria-label={`No cover for ${book?.title}`}>
      {initials}
    </div>
  );
}

// Shows how many copies are free, in words and colour
export function Availability({ book }) {
  const { availableCopies: a, totalCopies: t } = book;
  const tone = a === 0 ? 'text-brick' : a === 1 ? 'text-gold-dark' : 'text-sage';
  const dot = a === 0 ? 'bg-brick' : a === 1 ? 'bg-gold' : 'bg-sage';
  const text = a === 0 ? `All ${t} copies reserved` : a === 1 ? `Last copy (1 of ${t})` : `${a} of ${t} available`;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} /> {text}
    </span>
  );
}

export function BookCard({ book }) {
  return (
    <Link to={`/books/${book._id}`} className="panel group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <BookCover book={book} className="aspect-[3/4] w-full bg-parchment" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="w-fit rounded bg-gold-soft px-2 py-0.5 text-xs text-gold-dark">{book.category}</span>
        <h3 className="mt-1 text-lg leading-snug group-hover:text-gold-dark">{book.title}</h3>
        <p className="text-sm text-navy/65">{book.author}</p>
        <div className="mt-auto pt-3"><Availability book={book} /></div>
      </div>
    </Link>
  );
}

const statusStyles = {
  Pending: 'bg-gold-soft text-gold-dark',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Collected: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Returned: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  Cancelled: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Overdue: 'bg-red-600 text-white',
};

export function StatusBadge({ status }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] || ''}`}>{status}</span>;
}

// Shows "Overdue" next to a collected book that is past its due date
export function ReservationStatus({ r }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusBadge status={r.status} />
      {r.status === 'Collected' && r.overdueDays > 0 && <StatusBadge status="Overdue" />}
    </span>
  );
}
