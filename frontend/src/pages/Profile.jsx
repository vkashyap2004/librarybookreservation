import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api, { errorMessage } from '../services/api';
import { Spinner } from '../components/Feedback.jsx';
import { fmtDate } from '../utils/format.js';

const empty = { currentPassword: '', newPassword: '', confirm: '' };

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Enter your current password';
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword))
      e.newPassword = 'Use at least 8 characters with a letter and a number';
    else if (form.newPassword === form.currentPassword) e.newPassword = 'Choose a password different from the current one';
    if (form.confirm !== form.newPassword) e.confirm = 'Passwords do not match';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed');
      setForm(empty);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const details = [
    ['Name', user.name],
    user.usn && ['USN', user.usn],
    ['Email', user.email],
    ['Department', user.department],
    ['Account type', user.role === 'admin' ? 'Librarian' : 'Student'],
    ['Member since', fmtDate(user.createdAt)],
  ].filter(Boolean);

  const pwField = (id, label) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type="password" className="input" value={form[id]} onChange={set(id)} autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'} />
      {errors[id] && <p className="mt-1 text-xs text-brick">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl">Your profile</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {details.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-navy/5 pb-2 last:border-0">
                <dt className="text-navy/60">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl">Change password</h2>
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            {pwField('currentPassword', 'Current password')}
            {pwField('newPassword', 'New password')}
            {pwField('confirm', 'Confirm new password')}
            <button className="btn-primary" disabled={busy}>{busy && <Spinner size={16} />} Update password</button>
          </form>
        </section>
      </div>
    </div>
  );
}
