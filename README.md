# Real-Time Poll Rooms

## Fairness & Anti-Abuse Mechanisms
To prevent repeat and abusive voting, I implemented two distinct mechanisms:
1. **Server-Side IP Tracking (Database Level):** When a user votes, their IP address is passed to a Next.js API route. The server attempts to insert a record into a `vote_logs` table containing the `poll_id` and the `ip_address`. The database enforces a `UNIQUE(poll_id, ip_address)` constraint. If a user tries to vote again from the same IP, the database rejects it, and the API returns a 403 error. This prevents users from spamming votes via automated scripts or simply refreshing.
2. **Client-Side Storage (UX Level):** Once a successful vote is cast, `localStorage.setItem('voted_{poll_id}', 'true')` is triggered. The UI reads this and immediately disables the voting buttons, showing the user the real-time results instead. This prevents accidental double-clicks and provides immediate UI feedback.

## Edge Cases Handled
- **Empty Options:** The poll creation form filters out any options left completely blank before sending them to the database.
- **Division by Zero:** When calculating the percentage of votes for the real-time UI bars, the math logic includes a check (`totalVotes > 0 ? ... : 0`) to prevent `NaN` errors when the poll is brand new with 0 votes.

## Known Limitations & Future Improvements
- **IP Tracking Limits:** If multiple legitimate users are behind a shared NAT/Router (like a corporate office or school network), they will share the same IP address. The first person will vote successfully, but subsequent users will be blocked. A future improvement would be implementing proper user authentication (e.g., Google OAuth) or more sophisticated browser fingerprinting.