ISP UI global collection loading optimization
Changed file: src/hooks/useJsonCollection.js
- Cross-route collection snapshot lifetime increased from 5 to 45 seconds.
- Newly mounted pages render previously loaded collections immediately.
- Concurrent requests for a collection continue to be deduplicated.
- Remote-change events and successful writes update/invalidate the snapshot.
- Expired snapshots are fetched again. First visit to a collection still needs server round-trip.
Important: This does not fix a 10+ second first request or database query. Measure the API and investigate pagination/indexes separately.
