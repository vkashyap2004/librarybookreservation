import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../services/api';
import { Spinner } from '../components/Feedback.jsx';
import { FilterTabs } from '../components/ReservationTable.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('Student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const u = await login(form.email, form.password, role === 'Student' ? 'student' : 'admin');
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      navigate(u.role === 'admin' ? '/admin' : location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl">Log in</h1>
      <div className="mt-5"><FilterTabs options={['Student', 'Librarian']} value={role} onChange={setRole} /></div>
      <form onSubmit={submit} className="panel mt-5 space-y-4 p-6" noValidate>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <p className="mt-1 text-xs text-brick">{errors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {errors.password && <p className="mt-1 text-xs text-brick">{errors.password}</p>}
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner size={16} />} Log in as {role.toLowerCase()}</button>
      </form>
      {role === 'Student' && (
        <p className="mt-4 text-center text-sm text-navy/70">
          New here? <Link to="/register" className="font-medium text-gold-dark underline">Create a student account</Link>
        </p>
      )}
    </div>
  );
}
