import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Library, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useTheme from '../hooks/useTheme.js';

const studentLinks = [
  ['/dashboard', 'Dashboard'],
  ['/books', 'Browse books'],
  ['/reservations', 'Reservations'],
  ['/history', 'History'],
  ['/profile', 'Profile'],
];
const adminLinks = [
  ['/admin', 'Dashboard'],
  ['/admin/books', 'Manage books'],
  ['/admin/reservations', 'Reservations'],
  ['/books', 'Catalogue'],
  ['/profile', 'Profile'],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, toggleTheme] = useTheme();

  const links = user?.role === 'admin' ? adminLinks : user ? studentLinks : [];
  const home = user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/';

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success('You have been logged out');
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'}`;

  const themeButton = (
    <button onClick={toggleTheme} className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-chrome text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to={home} className="flex items-center gap-2 font-serif text-xl">
          <Library size={22} className="text-gold-light" /> SIT Library
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => (
            <NavLink key={to + label} to={to} end className={linkClass}>{label}</NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {themeButton}
          {user ? (
            <button onClick={handleLogout} className="btn border border-white/30 text-white hover:bg-white/10">
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm text-white/80 hover:text-white">Log in</Link>
              <Link to="/register" className="btn-gold">Register</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {themeButton}
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          {user && <p className="px-3 py-1 text-xs text-white/60">Signed in as {user.name}</p>}
          {links.map(([to, label]) => (
            <NavLink key={to + label} to={to} end className={linkClass} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
          {user ? (
            <button onClick={handleLogout} className="mt-2 rounded-md px-3 py-2 text-left text-sm text-white/80">Log out</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-white/80">Log in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-gold-light">Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
