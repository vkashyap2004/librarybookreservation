# REST API

Base URL: `http://localhost:5000/api`. Protected routes need `Authorization: Bearer <token>`.
Every response has the shape `{ "success": true|false, "message": "...", "data": {...} }`; errors may add `"errors": [...]`.

## Authentication
| Method | Endpoint | Access | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | /auth/register | public | name, usn, email, department, password | 201 token + user | 400 validation, 409 duplicate email/USN |
| POST | /auth/login | public | email, password, role (optional: student/admin) | 200 token + user | 400, 401 wrong credentials, 403 wrong role tab |
| GET | /auth/me | logged in | - | 200 user | 401 |
| PUT | /auth/password | logged in | currentPassword, newPassword | 200 | 400 weak/same password, 401 wrong current password |

## Books
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | /books | public | Query: `search` (title/author/ISBN), `category`, `availability` (available/unavailable), `sort` (`title` default, `newest`, `available`). Returns `books` and `categories` |
| GET | /books/:id | public | 404 if missing, 400 if id invalid |
| POST | /books | admin | title, author, isbn, category, publisher, totalCopies (+ description, coverImage). 201 |
| PUT | /books/:id | admin | Same fields. Changing totalCopies shifts availableCopies equally; 409 if below reserved count |
| DELETE | /books/:id | admin | 409 if the book has active reservations |

## Reservations
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | /reservations | student | Body `{ bookId }`. 201. 409 no copies / duplicate, 403 limit of 3 active reached, 404 unknown book |
| GET | /reservations/my | student | Query `status` (Pending, Approved, Collected, Overdue, Returned, Cancelled, Rejected, Expired), `active=true` |
| GET | /reservations | admin | Query `status`. All records with student and book populated |
| GET | /reservations/:id | owner or admin | 403 for other students |
| PUT | /reservations/:id/cancel | student (owner) | Only Pending/Approved. 409 if already collected, cancelled, etc.; 403 if not owner |
| PUT | /reservations/:id/status | admin | Body `{ status: "Approved" or "Rejected" }`, only for Pending. Approval sets `pickupDeadline`; sends an email |
| PUT | /reservations/:id/collect | admin | Approved -> Collected, sets `dueDate` |
| PUT | /reservations/:id/return | admin | Collected -> Returned, fixes `fineAmount`, releases the copy |
| PUT | /reservations/:id/pay-fine | admin | Marks an unpaid fine as paid |

## Statistics (extra)
| GET | /stats/admin | admin | counts, copy totals, awaiting pickup, overdue books, unpaid fines, recent reservations |
| GET | /stats/student | student | total, active, cancelled, outstanding fines, overdue count, recent |

## Status codes used
200 OK, 201 Created, 400 validation/invalid id, 401 not logged in/bad token, 403 forbidden, 404 not found, 409 conflict (business rule), 500 server error.

## Computed fields on every reservation
`overdueDays` and `fine` (Rs) are calculated by the server for Collected (live) and Returned (final) reservations.
