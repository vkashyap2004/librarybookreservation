import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarCheck, Undo2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const spineColors = ['bg-navy-800', 'bg-navy-700', 'bg-gold', 'bg-chrome', 'bg-amber-800', 'bg-emerald-800'];

export default function Landing() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);

  // Real books from the database appear as spines on the shelf
  useEffect(() => {
    api.get('/books').then((res) => setBooks(res.data.data.books.slice(0, 9))).catch(() => {});
  }, []);

  const cta = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/register';

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-4xl leading-tight md:text-5xl">Hold your textbook before the semester rush does.</h1>
          <p className="mt-5 max-w-md text-lg text-navy/70">
            Search the library catalogue, see how many copies are free, and reserve one in a click. Cancel any time and the copy goes straight back on the shelf.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={cta} className="btn-primary px-6 py-3">{user ? 'Open my dashboard' : 'Create a student account'}</Link>
            {!user && <Link to="/login" className="btn-ghost px-6 py-3">Log in</Link>}
          </div>
        </div>

        {/* The shelf: one spine per book, height hints at available copies */}
        <div className="flex h-72 items-end justify-center gap-1.5 border-b-8 border-navy px-2" aria-hidden={books.length === 0}>
          {books.map((b, i) => (
            <Link key={b._id} to={user ? `/books/${b._id}` : '/login'} title={`${b.title}: ${b.availableCopies} available`}
              className={`${spineColors[i % spineColors.length]} flex w-9 items-start justify-center rounded-t-sm pt-3 text-white transition-transform hover:-translate-y-2 ${b.availableCopies === 0 ? 'opacity-45' : ''}`}
              style={{ height: `${150 + ((i * 37) % 90)}px` }}>
              <span className="max-h-full overflow-hidden whitespace-nowrap font-serif text-sm" style={{ writingMode: 'vertical-rl' }}>
                {b.title.length > 26 ? `${b.title.slice(0, 24)}...` : b.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-parchment py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-3">
          {[
            [Search, 'Find the right book', 'Search by title, author or ISBN and filter by subject.'],
            [CalendarCheck, 'Reserve in one click', 'See live availability, then hold a copy. The librarian confirms it.'],
            [Undo2, 'Change your mind freely', 'Cancel an active reservation and the copy is released immediately.'],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon className="text-gold" />
              <h3 className="mt-3 text-xl">{title}</h3>
              <p className="mt-1 text-sm text-navy/70">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
