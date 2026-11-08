import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, PackageCheck, Undo2, IndianRupee } from 'lucide-react';
import api, { errorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';
import ReservationTable, { FilterTabs } from '../components/ReservationTable.jsx';
import { EmptyState, PageLoader } from '../components/Feedback.jsx';
import { STATUS_FILTERS } from '../utils/format.js';

export default function ManageReservations() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get('status') || 'All');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get('/reservations', { params: { status } })
      .then((res) => setRows(res.data.data.reservations))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); load(); }, [status]);

  // One handler for every librarian action: calls the endpoint, shows the server's message, refreshes
  const act = async (r, path, body) => {
    try {
      const res = await api.put(`/reservations/${r._id}/${path}`, body);
      toast.success(res.data.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
    await load();
  };

  const actions = (r) => {
    const small = 'px-3 py-1.5';
    if (r.status === 'Pending') return (
      <div className="flex justify-end gap-2">
        <button className={`btn-primary ${small}`} onClick={() => act(r, 'status', { status: 'Approved' })}><Check size={15} /> Approve</button>
        <button className={`btn-ghost text-brick ${small}`} onClick={() => act(r, 'status', { status: 'Rejected' })}><X size={15} /> Reject</button>
      </div>
    );
    if (r.status === 'Approved') return <button className={`btn-primary ${small}`} onClick={() => act(r, 'collect')}><PackageCheck size={15} /> Mark collected</button>;
    if (r.status === 'Collected') return <button className={`btn-primary ${small}`} onClick={() => act(r, 'return')}><Undo2 size={15} /> Mark returned</button>;
    if (r.status === 'Returned' && r.fineAmount > 0 && !r.finePaid) return <button className={`btn-gold ${small}`} onClick={() => act(r, 'pay-fine')}><IndianRupee size={15} /> Fine paid</button>;
    return <span className="text-navy/40">-</span>;
  };

  // Client-side search over what the API already returned
  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) =>
    !q || [r.reservationId, r.userId?.name, r.userId?.usn, r.bookId?.title].some((v) => v?.toLowerCase().includes(q)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl">Reservations</h1>
      <p className="mt-1 max-w-2xl text-navy/65">Approve requests, hand books over, take them back and collect fines. Approved books not collected in time expire automatically.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <input className="input max-w-xs" placeholder="Search student, USN, book or ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search reservations" />
      </div>

      <div className="mt-6">
        {loading ? <PageLoader /> : visible.length === 0 ? (
          <EmptyState title="No reservations found" message="Nothing matches this filter yet." />
        ) : <ReservationTable rows={visible} showStudent renderActions={actions} />}
      </div>
    </div>
  );
}
