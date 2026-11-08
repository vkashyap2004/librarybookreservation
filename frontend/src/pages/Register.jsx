import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../services/api';
import { Spinner } from '../components/Feedback.jsx';

const departments = ['Information Science', 'Computer Science', 'Electronics and Communication', 'Electrical and Electronics', 'Mechanical', 'Civil', 'Artificial Intelligence and Machine Learning'];

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', usn: '', email: '', department: departments[0], password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Same rules as the backend, so students get instant feedback
  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = 'Name must be at least 3 characters';
    if (!/^[1-4][A-Za-z]{2}\d{2}[A-Za-z]{2}\d{3}$/.test(form.usn.trim())) e.usn = 'USN must look like 1SI22IS001';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Use at least 8 characters with a letter and a number';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success('Account created. Welcome to the library!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (id, label, type = 'text', placeholder = '') => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="input" placeholder={placeholder} value={form[id]} onChange={set(id)} />
      {errors[id] && <p className="mt-1 text-xs text-brick">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="text-3xl">Create a student account</h1>
      <form onSubmit={submit} className="panel mt-6 space-y-4 p-6" noValidate>
        {field('name', 'Full name', 'text', 'Ananya Rao')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('usn', 'USN', 'text', '1SI22IS001')}
          <div>
            <label className="label" htmlFor="department">Department</label>
            <select id="department" className="input" value={form.department} onChange={set('department')}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        {field('email', 'Email', 'email', 'you@sit.ac.in')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('password', 'Password', 'password')}
          {field('confirm', 'Confirm password', 'password')}
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner size={16} />} Create account</button>
      </form>
      <p className="mt-4 text-center text-sm text-navy/70">
        Already registered? <Link to="/login" className="font-medium text-gold-dark underline">Log in</Link>
      </p>
    </div>
  );
}
