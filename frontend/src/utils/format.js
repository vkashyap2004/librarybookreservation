export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export const fmtMoney = (n) => `₹${n || 0}`;

// Status filter options shared by the history and admin pages
export const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Collected', 'Overdue', 'Returned', 'Cancelled', 'Rejected', 'Expired'];
