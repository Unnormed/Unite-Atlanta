# Unite Atlanta · concept v5

Brutalist editorial concept site for Unite Atlanta: one calendar, one community, one voice for Atlanta's music scene.

## Structure
- `index.html` — main site (calendar, mission, Plus, Atlanta Speaks, how it runs, newsletter)
- `speaks/*.html` — Atlanta Speaks journal pages (`/speaks/<name>` with cleanUrls)
- `admin.html` — team backend at `/admin` (staff code required)
- `assets/` — shared styles, data, site script. `data.js` holds the sample events, Speaks posts, pitches and the proposed operating model (`ops`: listing criteria, roles, Speaks policy)
- `img/` — photography

## Demo codes
- Plus (unlocks the Back Room): `MIDNIGHT`
- Backend at `/admin`: `BACKSTAGE`

## Demo notes
State (submissions, approvals, RSVPs, subscribers) is stored in the visitor's browser (localStorage). The production build needs a real database + server-side auth; this preview demonstrates the full workflow.

Sample programming for concept review. Photography generated for concept purposes.

## v5 (Oct 2026) · feedback round
- Photography and sample voices/programming widened to represent the whole Atlanta music community
- "Two doors, one house" replaced with plain language: open to all, Plus by invitation
- "How it runs" section + backend Operations tab: listing criteria, review flow, four roles (owners to be decided)
- Event approval in the backend is gated on the listing criteria; declines carry a reason
- Atlanta Speaks: commissioned + community pitches ("Pitch a piece"), pitch queue in the backend
