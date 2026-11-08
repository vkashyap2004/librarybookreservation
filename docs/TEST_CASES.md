# Test cases

Run each case through the app or Postman, then record **your own** actual result and screenshot. Expected results are what the code is designed to do.

| # | Test | Steps | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Student registration | Register with valid name, USN `1SI22IS099`, email, department, password `Test@1234` | 201, redirected to dashboard | | |
| 1b | Registration validation | Use USN `ABC` or password `abc` | 400 / inline error, no account | | |
| 1c | Duplicate registration | Register again with same email | 409 "already in use" | | |
| 2 | Student login | Log in with seeded student | 200, dashboard shown | | |
| 3 | Invalid login | Wrong password | 401 "Incorrect email or password" | | |
| 4 | Display books | Open Browse books | 12 seeded books as cards | | |
| 5 | Search | Type `cormen`, then ISBN `9780132350884` | Matching book(s) only | | |
| 6 | Filter | Category = Web Development | Only that category | | |
| 7 | Check availability | Open a book | Total, available count and status shown | | |
| 8 | Successful reservation | Reserve "Eloquent JavaScript" | 201, toast with RSV id, available copies drops by 1, appears in My reservations | | |
| 9 | Unavailable book | Log in as ananya, reserve "Data Mining" (0 left after seed) | 409 "No copies...", button disabled in UI | | |
| 10 | Duplicate prevention | Reserve the same book twice | 409 "already have an active reservation" | | |
| 10b | Active limit | Hold 3 reservations, try a 4th | 403 limit message | | |
| 11 | Cancellation | Cancel an active reservation | Status Cancelled, confirmation toast | | |
| 12 | Availability after cancel | Reopen the book | Available copies increased by 1, never above total | | |
| 12b | Cancel twice | Cancel same id again (Postman) | 409 already cancelled | | |
| 12c | Cancel other's | Student B cancels student A's id | 403 | | |
| 13 | History | Open Reservation history, use filters | Cancelled record still listed | | |
| 14 | Unauthorized access | Student token on `GET /api/reservations`, `POST /api/books`; open `/admin` in browser | 403 / redirected to dashboard; no token gives 401 | | |
| 15 | Admin book management | Add, edit, +/- quantity, delete a book | Each change saved in MongoDB | | |
| 15b | Delete with reservations | Delete a book that has Pending/Approved reservation | 409 | | |
| 15c | Lower copies than reserved | Edit total below reserved count | 409 / form error | | |
| 16 | Approve/Reject | Admin approves one Pending and rejects another | Status changes; rejected copy released | | |
| 17 | Race condition | Two students reserve the last copy at the same time (Postman Runner / two tabs) | Exactly one succeeds, other gets 409 | | |
| 18 | Dark mode | Click the moon icon, refresh the page | Dark theme stays; icon changes to sun | | |
| 19 | Sort | Browse: Newest first, Most available, Title | Order changes accordingly | | |
| 20 | Profile details | Open Profile | Name, USN, email, department, member since shown | | |
| 21 | Change password | Wrong current password; weak new password; valid change; log in again with new one | 401 / 400 / success / login works | | |
| 22 | Pickup deadline | Admin approves a Pending reservation | Student sees "Collect by (date, +3 days)" | | |
| 23 | Mark collected | Admin clicks Mark collected | Status Collected, due date +14 days, student cannot cancel it (409) | | |
| 24 | Mark returned on time | Admin clicks Mark returned | Status Returned, "no fine", copy count +1 | | |
| 25 | Overdue and live fine | Log in as Meera (seed) | Overdue tag, fine grows by Rs 5 per day, dashboard warning, reserving blocked (403) | | |
| 26 | Late return fine | Admin returns Meera's book | Returned, fine fixed, shown unpaid | | |
| 27 | Pay fine | Admin clicks Fine paid | Fine shows paid, student can reserve again | | |
| 28 | Unpaid fine blocks reserving | Log in as Rahul (seed), reserve a book | 403 "overdue book or unpaid fine" | | |
| 29 | Expiry | Approve a reservation, then set its `pickupDeadline` to a past date in Compass, open Reservations | Status Expired, copy released, expiry email in console/inbox | | |
| 30 | Emails | Approve one and reject another (SMTP set, or watch the backend console) | Approval and rejection emails produced | | |

