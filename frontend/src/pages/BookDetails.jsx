import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Availability, BookCover, StatusBadge } from '../components/BookParts.jsx';
import { PageLoader, Spinner, EmptyState } from '../components/Feedback.jsx';

export default function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [book, setBook] = useState(null);
  const [mine, setMine] = useState(null); // this student's active reservation for the book, if any
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/books/${id}`);
      setBook(res.data.data.book);
      if (user.role === 'student') {
        const r = await api.get('/reservations/my', { params: { active: true } });
        setMine(r.data.data.reservations.find((x) => x.bookId?._id === id) || null);
      }
    } catch (e) {
      setBook(null);
      if (e.response?.status !== 404) toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const reserve = async () => {
    setBusy(true);
    try {
      const res = await api.post('/reservations', { bookId: id });
      toast.success(`Reserved! Your reservation ID is ${res.data.data.reservation.reservationId}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      await load(); // refresh the copy count either way
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!book) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Book not found" message="It may have been removed from the catalogue." action={<Link to="/books" className="btn-primary">Back to books</Link>} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/books" className="inline-flex items-center gap-1 text-sm text-navy/65 hover:text-navy"><ArrowLeft size={16} /> All books</Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[260px_1fr]">
        <BookCover book={book} className="aspect-[3/4] w-full max-w-[260px] rounded-lg bg-parchment shadow-md" />
        <div>
          <span className="rounded bg-gold-soft px-2 py-0.5 text-xs text-gold-dark">{book.category}</span>
          <h1 className="mt-2 text-4xl leading-tight">{book.title}</h1>
          <p className="mt-1 text-lg text-navy/70">by {book.author}</p>
          <p className="mt-4 max-w-prose text-navy/80">{book.description || 'No description available.'}</p>

          <dl className="mt-6 grid max-w-md grid-cols-2 gap-y-2 text-sm">
            <dt className="text-navy/60">ISBN</dt><dd>{book.isbn}</dd>
            <dt className="text-navy/60">Publisher</dt><dd>{book.publisher}</dd>
            <dt className="text-navy/60">Total copies</dt><dd>{book.totalCopies}</dd>
            <dt className="text-navy/60">Available copies</dt><dd>{book.availableCopies}</dd>
          </dl>

          <div className="mt-6"><Availability book={book} /></div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {user.role === 'student' && (mine ? (
              <>
                <StatusBadge status={mine.status} />
                <span className="text-sm text-navy/70">You already hold a copy.</span>
                <Link to="/reservations" className="btn-ghost">Manage reservation</Link>
              </>
            ) : (
              <button className="btn-gold px-6 py-3" onClick={reserve} disabled={busy || book.availableCopies === 0}>
                {busy && <Spinner size={16} />} {book.availableCopies === 0 ? 'No copies available' : 'Reserve book'}
              </button>
            ))}
            {user.role === 'admin' && <Link to={`/admin/books/${book._id}/edit`} className="btn-primary">Edit this book</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
