import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext.jsx';
import { BookCard } from '../components/BookParts.jsx';
import { EmptyState, PageLoader } from '../components/Feedback.jsx';

export default function BrowseBooks() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('title');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  // Re-fetch from the API whenever a filter changes
  useEffect(() => {
    setLoading(true);
    api.get('/books', { params: { search: debouncedSearch, category, availability, sort } })
      .then((res) => {
        setBooks(res.data.data.books);
        setCategories(res.data.data.categories);
      })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, availability, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Browse books</h1>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <input className="input" placeholder="Search by title, author or ISBN" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search books" />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="All">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Filter by availability">
          <option value="">Any availability</option>
          <option value="available">Available now</option>
          <option value="unavailable">Fully reserved</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort books">
          <option value="title">Sort: Title (A to Z)</option>
          <option value="newest">Sort: Newest first</option>
          <option value="available">Sort: Most available</option>
        </select>
      </div>

      <div className="mt-8">
        {loading ? <PageLoader /> : books.length === 0 ? (
          <EmptyState title="No books match" message="Try a different title, author or ISBN, or clear the filters." />
        ) : (
          <>
            <p className="mb-4 text-sm text-navy/60">{books.length} {books.length === 1 ? 'book' : 'books'} found</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {books.map((b) => <BookCard key={b._id} book={b} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
