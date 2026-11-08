import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';
import { PageLoader, Spinner } from '../components/Feedback.jsx';

const empty = { title: '', author: '', isbn: '', category: '', publisher: '', description: '', coverImage: '', totalCopies: 1 };

// One form for both "Add book" and "Edit book"
export default function BookForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [reserved, setReserved] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/books/${id}`)
      .then((res) => {
        const b = res.data.data.book;
        setForm({ ...empty, ...b });
        setReserved(b.totalCopies - b.availableCopies);
      })
      .catch((e) => { toast.error(errorMessage(e)); navigate('/admin/books'); })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!/^(\d{9}[\dXx]|\d{13})$/.test(form.isbn.replace(/[-\s]/g, ''))) e.isbn = 'ISBN must be 10 or 13 digits';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.publisher.trim()) e.publisher = 'Publisher is required';
    const n = Number(form.totalCopies);
    if (!Number.isInteger(n) || n < 0) e.totalCopies = 'Enter a whole number, 0 or more';
    else if (editing && n < reserved) e.totalCopies = `${reserved} ${reserved === 1 ? 'copy is' : 'copies are'} reserved right now, so total cannot be lower`;
    if (form.coverImage && !/^https?:\/\/\S+$/i.test(form.coverImage)) e.coverImage = 'Use a full http(s) link';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const payload = { ...form, totalCopies: Number(form.totalCopies) };
      if (editing) await api.put(`/books/${id}`, payload);
      else await api.post('/books', payload);
      toast.success(editing ? 'Book updated' : 'Book added');
      navigate('/admin/books');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, props = {}) => (
    <div className={props.wide ? 'md:col-span-2' : ''}>
      <label className="label" htmlFor={key}>{label}</label>
      {props.area ? (
        <textarea id={key} rows={4} className="input" value={form[key]} onChange={set(key)} />
      ) : (
        <input id={key} type={props.type || 'text'} min={props.type === 'number' ? 0 : undefined} className="input" placeholder={props.placeholder} value={form[key]} onChange={set(key)} />
      )}
      {props.hint && !errors[key] && <p className="mt-1 text-xs text-navy/55">{props.hint}</p>}
      {errors[key] && <p className="mt-1 text-xs text-brick">{errors[key]}</p>}
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/admin/books" className="inline-flex items-center gap-1 text-sm text-navy/65 hover:text-navy"><ArrowLeft size={16} /> Book inventory</Link>
      <h1 className="mt-3 text-3xl">{editing ? 'Edit book' : 'Add a book'}</h1>

      <form onSubmit={submit} noValidate className="panel mt-6 grid gap-4 p-6 md:grid-cols-2">
        {field('title', 'Title', { wide: true })}
        {field('author', 'Author')}
        {field('isbn', 'ISBN', { placeholder: '978-0-13-235088-4' })}
        {field('category', 'Category', { placeholder: 'Software Engineering' })}
        {field('publisher', 'Publisher')}
        {field('totalCopies', 'Total copies', { type: 'number', hint: editing ? `${reserved} currently reserved. Available copies adjust automatically.` : 'Every copy starts out available.' })}
        {field('coverImage', 'Cover image link (optional)', { placeholder: 'https://...' })}
        {field('description', 'Short description', { area: true, wide: true })}
        <div className="flex gap-2 md:col-span-2">
          <button className="btn-primary" disabled={busy}>{busy && <Spinner size={16} />} {editing ? 'Save changes' : 'Add book'}</button>
          <Link to="/admin/books" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
