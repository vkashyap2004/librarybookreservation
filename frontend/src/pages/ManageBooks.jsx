import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Minus } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext.jsx';
import { BookCover } from '../components/BookParts.jsx';
import { ConfirmModal, EmptyState, PageLoader } from '../components/Feedback.jsx';

export default function ManageBooks() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const debounced = useDebounce(search, 300);

  const load = () =>
    api.get('/books', { params: { search: debounced, category, availability } })
      .then((res) => { setBooks(res.data.data.books); setCategories(res.data.data.categories); })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [debounced, category, availability]);

  // Quick quantity change: sends the whole book with totalCopies +1 or -1
  const changeQty = async (b, delta) => {
    try {
      await api.put(`/books/${b._id}`, { ...b, totalCopies: b.totalCopies + delta });
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/books/${target._id}`);
      toast.success(`"${target.title}" deleted`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setTarget(null);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Book inventory</h1>
        <Link to="/admin/books/new" className="btn-gold"><Plus size={16} /> Add book</Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <input className="input" placeholder="Search by title, author or ISBN" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search books" />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="All">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Availability">
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? <PageLoader /> : books.length === 0 ? (
          <EmptyState title="No books found" message="Add a book or change the filters." action={<Link to="/admin/books/new" className="btn-primary">Add a book</Link>} />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-navy/10 bg-parchment text-navy/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">ISBN</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Total copies</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b._id} className="border-b border-navy/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BookCover book={b} className="h-12 w-9 shrink-0 rounded" />
                        <div><p className="font-medium">{b.title}</p><p className="text-navy/60">{b.author}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.isbn}</td>
                    <td className="px-4 py-3">{b.category}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1">
                        <button className="rounded border border-navy/20 p-1 hover:bg-parchment disabled:opacity-40" onClick={() => changeQty(b, -1)} disabled={b.availableCopies === 0} aria-label={`Remove one copy of ${b.title}`}><Minus size={14} /></button>
                        <span className="w-8 text-center">{b.totalCopies}</span>
                        <button className="rounded border border-navy/20 p-1 hover:bg-parchment" onClick={() => changeQty(b, 1)} aria-label={`Add one copy of ${b.title}`}><Plus size={14} /></button>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-medium ${b.availableCopies === 0 ? 'text-brick' : 'text-sage'}`}>{b.availableCopies === 0 ? 'None' : b.availableCopies}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/books/${b._id}/edit`} className="btn-ghost px-2.5 py-1.5" aria-label={`Edit ${b.title}`}><Pencil size={15} /></Link>
                        <button className="btn-ghost px-2.5 py-1.5 text-brick" onClick={() => setTarget(b)} aria-label={`Delete ${b.title}`}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal open={!!target} danger busy={busy} title="Delete this book?"
        message={target ? `"${target.title}" will be removed from the catalogue. Past reservation records are kept.` : ''}
        confirmLabel="Delete book" onConfirm={remove} onCancel={() => setTarget(null)} />
    </div>
  );
}
