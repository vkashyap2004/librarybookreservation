import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-navy/10 bg-parchment py-6 text-center text-sm text-navy/60">
        Siddaganga Institute of Technology, Department of Information Science and Engineering
      </footer>
    </div>
  );
}
