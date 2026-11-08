# Database design (MongoDB, Mongoose)

## users
| Field | Type | Notes |
|---|---|---|
| name | String | required, min 3 |
| usn | String | uppercase, unique, sparse (admins have none) |
| email | String | required, unique, lowercase |
| password | String | bcrypt hash, `select: false` |
| department | String | |
| role | String | `student` or `admin` |
| createdAt | Date | |

## books
| Field | Type | Notes |
|---|---|---|
| title, author, publisher, category | String | required |
| isbn | String | required, unique, 10 or 13 digits |
| description | String | max 1000 |
| coverImage | String | URL |
| totalCopies | Number | >= 0 |
| availableCopies | Number | >= 0 and <= totalCopies (validator) |
| createdAt | Date | |
Indexes: unique `isbn`; `title`, `author`, `category`.

## reservations
| Field | Type | Notes |
|---|---|---|
| reservationId | String | unique, e.g. `RSV-LX3K9A2F` |
| userId | ObjectId -> users | required |
| bookId | ObjectId -> books | required |
| reservationDate | Date | |
| status | String | Pending / Approved / Collected / Returned / Rejected / Cancelled / Expired |
| isActive | Boolean | true for Pending, Approved, Collected |
| cancellationDate | Date | set on cancel |
| reviewedBy, reviewedAt | ObjectId -> users, Date | set when admin approves/rejects |
| pickupDeadline | Date | set on approval (+3 days) |
| collectedAt, dueDate | Date | set when marked collected (due = +14 days) |
| returnedAt | Date | set on return |
| expiredAt | Date | set when a pickup lapses |
| fineAmount, finePaid, finePaidAt | Number, Boolean, Date | fine fixed on return, paid at the desk |
| createdAt | Date | |
Indexes: unique `reservationId`; **unique partial `{userId, bookId}` where `isActive = true`** (blocks duplicate active reservations); `{userId, createdAt}`; `status`; `{status, pickupDeadline}` (expiry sweep).
Virtual (not stored): `overdueDays`, `fine`.

## Collection diagram (for the report)
```
users 1 ----< reservations >---- 1 books
 (userId)                         (bookId)
```
One user has many reservations; one book has many reservations.

Sample records: run `npm run seed`, then open MongoDB Compass and screenshot each collection.
