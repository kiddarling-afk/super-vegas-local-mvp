# Super Vegas Local MVP

A self-contained, browser-local demonstration of a mobile-first, multi-location bowling league ecosystem.

## What is implemented

- Responsive bowler dashboard, schedule, standings, scores/averages, sweeps/events, captain team hub, and operations views.
- Two isolated seeded organizations, each with two centers.
- Five role demonstrations: Bowler, Captain, League Admin, Center Admin, Organization Admin.
- Local browser persistence (`localStorage`) and a **Reset demo data** control.
- Scorecard workflow: manual import validation, pending review, required-reason rejection with retained record, publish, standings revision, and audit trail.
- Explainable event eligibility based on published games and configurable thresholds.

## Run it

Open `index.html` in a modern browser. No npm install, API key, or server is required.

For a local HTTP server (optional; if Python is installed):

```powershell
cd super-vegas-local-mvp
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Quick demo script

1. Start as **Bowler**: inspect average, schedule, standings, and event eligibility.
2. Switch to **Captain**: open Team hub and confirm the Week 3 lineup.
3. Switch to **League Admin**: open Operations; publish the pending scorecard and observe standings/eligibility updates.
4. Import a new valid scorecard; attempt a duplicate or out-of-range score to see validation.
5. Reject a pending scorecard: a reason is required and the record remains retained in the rejection ledger.
6. Switch organizations using the header selector: their schedules, scores, rules, audit histories, and centers are independent.

## Deliberate boundary

This is a local demonstrator, not a production service. It has no real authentication, server-side authorization, database, payment processing, scoring-provider integration, or lane-control integration. Role boundaries are demonstrated in the UI and state model only; production enforcement belongs in a backend.
