import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';
import ReservationTable, { FilterTabs } from '../components/ReservationTable.jsx';
import { STATUS_FILTERS } from '../utils/format.js';
import { EmptyState, PageLoader } from '../components/Feedback.jsx';

export default function ReservationHistory() {
  const toast = useToast();
  const [status, setStatus] = useState('All');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/reservations/my', { params: { status } })
      .then((res) => setRows(res.data.data.reservations))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Reservation history</h1>
      <p className="mt-1 text-navy/65">Every reservation you have made, from request to return, including cancelled and expired ones.</p>
      <div className="mt-6"><FilterTabs options={STATUS_FILTERS} value={status} onChange={setStatus} /></div>
      <div className="mt-6">
        {loading ? <PageLoader /> : rows.length === 0 ? (
          <EmptyState title="No reservations here" message={status === 'All' ? 'Reserve a book and it will appear in your history.' : `You have no ${status.toLowerCase()} reservations.`} action={<Link to="/books" className="btn-primary">Browse books</Link>} />
        ) : <ReservationTable rows={rows} />}
      </div>
    </div>
  );
}
