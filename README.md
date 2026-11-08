# Library Book Reservation System

Full Stack Development, VII Semester Microproject
Siddaganga Institute of Technology, Department of Information Science and Engineering (2026-2027)

A MERN application where students browse books, check availability, reserve and cancel reservations, and librarians manage the inventory and approve reservations.

**Stack:** React (Vite) + Tailwind CSS + React Router + Axios + Lucide icons | Node.js + Express | MongoDB + Mongoose | JWT + bcrypt

## 1. Prerequisites
- Node.js 18 or newer
- MongoDB running locally (default `mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- Optional: Postman, MongoDB Compass

## 2. Setup and run

```bash
# Backend (terminal 1)
cd backend
cp .env.example .env        # then edit JWT_SECRET (and MONGO_URI if needed)
npm install
npm run seed                # inserts sample admin, students, books, reservations
npm run dev                 # API on http://localhost:5000

# Frontend (terminal 2)
cd frontend
cp .env.example .env        # optional, defaults to http://localhost:5000/api
npm install
npm run dev                 # app on http://localhost:5173
```

## 3. Demo accounts (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Librarian (admin) | admin@library.sit.ac.in | Admin@123 |
| Student (clean account) | ananya@sit.ac.in | Student@123 |
| Student (has an unpaid fine) | rahul@sit.ac.in | Student@123 |
| Student (has an overdue book) | meera@sit.ac.in | Student@123 |

Students can also register themselves. Admin accounts are only created by the seed script, so nobody can sign up as admin.

## 4. Features
**Student:** register, log in, dashboard with stats and fine warnings, browse and search (title, author, ISBN), filter by category and availability, **sort (title, newest, most available)**, book details, reserve, cancel, my reservations with pickup/due dates, full history with status filters, **profile page with password change**.
**Librarian:** dashboard with statistics, shelf bar, pickups, overdue books and unpaid fines; add/edit/delete books; quick quantity +/-; approve or reject reservations; **mark collected, mark returned, mark fine paid**.
**Everyone:** **dark mode toggle** (sun/moon icon in the top bar, remembers your choice).
**Automatic:** approved reservations not collected in time **expire** and the copy is released; **emails** are sent on approval, rejection and expiry.

## 5. Reservation lifecycle, due dates and fines
```
Pending -> Approved -> Collected -> Returned
   |          |
   |          +-> Expired (not collected within 3 days of approval)
   +-> Rejected                Pending / Approved -> Cancelled (by the student)
```
- A copy is held while a reservation is Pending, Approved or Collected, and released on Returned, Rejected, Cancelled or Expired. "Active" means one of the first three.
- **Pickup deadline:** 3 days after approval (`PICKUP_DAYS`). After that the reservation expires automatically (checked every 10 minutes and whenever lists load).
- **Due date:** 14 days after the librarian marks the book collected (`LOAN_DAYS`).
- **Fine:** Rs 5 per overdue day (`FINE_PER_DAY`); a part-day counts as a full day. It grows live while the book is out and is fixed when the librarian marks it returned. The librarian then marks it paid.
- **Overdue** is shown as a red tag on Collected books past their due date (it is a filter, not a stored status).
- A student with an overdue book or an unpaid fine cannot make new reservations. Students can hold at most 3 active reservations.
- A student can cancel only before collecting; after that the book is returned at the desk.
- Change the three numbers in `backend/.env` (see `.env.example`).

## 5b. Email notifications (Nodemailer)
Emails go out when a reservation is **approved**, **rejected** or **expires**. Set these in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<a Gmail App Password, not your normal password>
MAIL_FROM="SIT Library <you@gmail.com>"
```
If `SMTP_HOST` is empty, the email text is printed in the backend terminal instead, which is handy for demos. A failed email never blocks a reservation. Students need a real email address on their account to receive it.

## 6. How the business rules are enforced
| Rule | Where |
|---|---|
| No reservation at zero copies; no double booking of the last copy | `Book.findOneAndUpdate({ availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } })` is one atomic operation |
| No duplicate active reservation | pre-check + partial unique index on `{userId, bookId}` where `isActive: true` |
| Available never exceeds total | schema validator + `$expr` guard when releasing a copy |
| Cancel only own, active reservation | one atomic `findOneAndUpdate` filtered by `_id`, `userId`, `isActive` |
| Students cannot use admin APIs | `protect` + `authorize('admin')` middleware, plus frontend `ProtectedRoute` |
| Cancelled records stay | status changes, nothing is deleted |

## 7. Project structure
```
backend/   config/ controllers/ middleware/ models/ routes/ utils/ seed/ server.js
frontend/  src/ components/ pages/ layouts/ context/ services/ hooks/ utils/ App.jsx main.jsx
docs/      API.md  DATABASE.md  TEST_CASES.md  VIVA_NOTES.md  REPORT_TEMPLATE.md  postman_collection.json
```

## 8. Testing
- Import `docs/postman_collection.json` into Postman. Run the folders in order; scripts store tokens and ids automatically.
- Manual test table: `docs/TEST_CASES.md` (fill in the Actual/Result columns from your own runs).

## 9. Notes
- `bcryptjs` (pure JavaScript bcrypt) is used so installation works on every machine without native compilation.
- `GET /api/books` is public (read-only) so the landing page can show real books. Everything else needs a token.
- Book covers use Open Library image URLs; a styled placeholder appears if an image is missing.
