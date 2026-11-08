import { Routes, Route, Link } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import BrowseBooks from './pages/BrowseBooks.jsx';
import BookDetails from './pages/BookDetails.jsx';
import MyReservations from './pages/MyReservations.jsx';
import ReservationHistory from './pages/ReservationHistory.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManageBooks from './pages/ManageBooks.jsx';
import BookForm from './pages/BookForm.jsx';
import ManageReservations from './pages/ManageReservations.jsx';
import Profile from './pages/Profile.jsx';

const student = (el) => <ProtectedRoute role="student">{el}</ProtectedRoute>;
const admin = (el) => <ProtectedRoute role="admin">{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Both roles can browse the catalogue */}
        <Route path="/books" element={<ProtectedRoute><BrowseBooks /></ProtectedRoute>} />
        <Route path="/books/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Student only */}
        <Route path="/dashboard" element={student(<StudentDashboard />)} />
        <Route path="/reservations" element={student(<MyReservations />)} />
        <Route path="/history" element={student(<ReservationHistory />)} />

        {/* Administrator only */}
        <Route path="/admin" element={admin(<AdminDashboard />)} />
        <Route path="/admin/books" element={admin(<ManageBooks />)} />
        <Route path="/admin/books/new" element={admin(<BookForm />)} />
        <Route path="/admin/books/:id/edit" element={admin(<BookForm />)} />
        <Route path="/admin/reservations" element={admin(<ManageReservations />)} />

        <Route path="*" element={
          <div className="mx-auto max-w-md px-4 py-24 text-center">
            <h1 className="text-3xl">Page not found</h1>
            <p className="mt-2 text-navy/70">The page you are looking for does not exist.</p>
            <Link to="/" className="btn-primary mt-6">Go to home</Link>
          </div>
        } />
      </Route>
    </Routes>
  );
}
