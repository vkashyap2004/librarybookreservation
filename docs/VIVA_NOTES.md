# Viva notes

**Architecture:** React SPA -> Axios -> Express REST API -> Mongoose -> MongoDB. JWT in the `Authorization` header; stored in localStorage.

**React hooks used (point to the file):**
- `useState`: form fields, loading flags, lists (every page).
- `useEffect`: fetch data when a page opens or a filter changes (`BrowseBooks.jsx`), restore login on refresh (`AuthContext.jsx`), debounce timer (`hooks/useDebounce.js`).
- `useContext`: `AuthContext` (current user), `ToastContext` (notifications).
- Custom hook: `useDebounce`.

**Routing:** React Router v6; `ProtectedRoute` checks login and role.

**Authentication flow:** register/login -> server hashes (bcrypt) / compares -> signs JWT with `JWT_SECRET` -> client stores token -> Axios interceptor sends it -> `protect` middleware verifies and loads the user -> `authorize('admin')` checks the role.

**Reservation logic in one sentence:** the copy count is decreased by a single atomic MongoDB update that only matches when `availableCopies > 0`, so two students cannot take the last copy.

**Why isActive?** MongoDB partial unique indexes support simple equality filters, so `isActive: true` lets the database itself reject a second active reservation for the same student and book.

**Lifecycle and fines:** Pending -> Approved (pickupDeadline +3 days) -> Collected (dueDate +14 days) -> Returned. Fine = overdue days x Rs 5, shown live by a Mongoose virtual and stored when returned. Expiry: `utils/expiry.js` finds Approved reservations past their deadline, marks them Expired with a status-guarded atomic update and releases the copy; it runs every 10 minutes (`server.js`) and before lists load.

**Dark mode:** colours are CSS variables (`index.css`); Tailwind `darkMode: 'class'`; `useTheme` toggles the `dark` class on `<html>` and saves the choice in localStorage.

**Email:** `utils/mailer.js` (Nodemailer) and `utils/notify.js` (templates). It never throws, and prints to the console when SMTP is not configured.

**Password change:** `PUT /api/auth/password` checks the current password with bcrypt, validates the new one, and the User pre-save hook hashes it.

**Cancellation:** atomic update on `{_id, userId, isActive: true}` -> status `Cancelled` -> `$inc +1` on the book, guarded so available never exceeds total.

**Likely questions**
- Why not store reservations inside the book? Reservations grow unbounded and need their own history and queries.
- Why 409 and not 400 for "no copies"? The request is valid but conflicts with current state.
- What happens if saving the reservation fails after the copy was taken? The controller releases the copy again (see the `catch` in `createReservation`).
- Known limit: the "max 3 active" check is a read-then-write and not atomic; the duplicate and stock rules are atomic.

**Team contribution table:** add each member's modules here before the viva.
