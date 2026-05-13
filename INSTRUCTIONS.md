# Full Stack HomeTask — Applicant Instructions

## Overview

You have been given a working application with a professional layered backend
(Express) and a React frontend. Your job is to extend it with the two features below.

Read the codebase before you start — understanding the existing structure is part of
what we are evaluating.

**Time budget: 4–6 hours.**

---

## Phase 1 — Setup & Code Comprehension

```bash
npm install
cp .env.example .env

# Terminal 1 — React dev server (port 3000)
npm start

# Terminal 2 — API server (port 3002, auto-reload)
npm run dev
```

Open `http://localhost:3000` and verify the UI loads correctly.

### Understand the architecture before coding

| Layer | Location | Purpose |
|---|---|---|
| Config | `config/index.js` | All env-driven settings |
| Domain models | `models/blockchain.js` | Block, Transaction, Blockchain classes |
| Singleton | `models/index.js` | Single shared blockchain instance |
| Utilities | `utils/` | Logger, response builder, validators |
| Middleware | `middleware/` | CORS, request logging, error handler, rate limiter, body validation |
| Routes | `routes/` | One file per resource |
| Controllers | `controllers/` | Business logic called by routes |
| API client | `src/api/` | All frontend HTTP calls go through here |
| Hooks | `src/hooks/` | `useBlockchain` polls the API and owns state |

Be ready to walk through the code in the interview and explain any part of it.

---

## Task 1 — Transaction Search & Filtering

**Goal:** Add the ability to search and filter transactions across the entire chain.

### Backend

- [ ] Add `GET /api/transactions/search` that accepts the following optional query parameters:
  - `fromAddress` — filter by sender address (partial, case-insensitive match)
  - `toAddress` — filter by recipient address (partial, case-insensitive match)
  - `minAmount` — minimum transaction amount (inclusive)
  - `maxAmount` — maximum transaction amount (inclusive)
  - `startDate` — Unix timestamp (ms); include only transactions at or after this time
  - `endDate` — Unix timestamp (ms); include only transactions at or before this time
- [ ] Search across **all confirmed transactions** in the chain (not just pending ones)
- [ ] Return `{ results: [...], count: N }` alongside the standard response envelope
- [ ] Reject invalid parameter values (non-numeric amounts/dates, negative amounts) with a `400` error

### Frontend

- [ ] Create a `TransactionSearch` component that:
  - Renders a form with inputs for all six filter fields
  - Calls `GET /api/transactions/search` on submit
  - Displays the results in a list (amount, from → to, timestamp)
  - Shows a "no results" state and a loading state
  - Clears results and resets the form on a **Clear** button
- [ ] Wire the new component into `App.js`

### Rules

- Add the new endpoint following the existing `routes/` → `controllers/` pattern
- Use `utils/response.js` (`sendSuccess` / `sendError`) for all responses
- Use `validateBody` / query-param validation middleware where applicable
- The frontend component must call the API through `src/api/blockchain.api.js` — no direct `fetch`/`axios` calls in components

---

## Task 2 — Data Persistence

**Goal:** Application state must survive server restarts.

### What to build

- [ ] Create `services/persistence.service.js` with three functions:
  - `save(blockchain)` — serialises and writes the chain + pending transactions to disk
  - `load()` — reads and deserialises the saved state; returns `null` if no file exists
  - `clear()` — deletes the saved state (useful for testing)
- [ ] Update `models/index.js` to call `load()` on startup — if a saved state exists, restore it instead of seeding demo data
- [ ] Call `save()` automatically after every successful mine and after every new transaction is added
- [ ] Handle all edge cases gracefully:
  - File does not exist → start fresh, no crash
  - File is corrupt / invalid JSON → log a warning, start fresh, no crash
  - Loaded data fails basic integrity checks → log a warning, start fresh

### Storage format

Use a plain JSON file (`blockchain.json` in the project root, already gitignored). Document
the shape of the file in a JSDoc comment at the top of `persistence.service.js`.

### Rules

- All file I/O errors must be caught — the server must never crash due to a persistence failure
- Use `utils/logger.js` to log save, load, and error events
- Do **not** add persistence logic directly in `server.js` or any controller

---

## Phase 3 — Documentation

- [ ] Add a `## Changes` section to `README.md` describing what you built and any new env vars
- [ ] Add JSDoc comments to every new function and class you write
- [ ] Note any known limitations or trade-offs at the bottom of your `README.md` changes

---

## Evaluation Criteria

| Area | Weight | What we look at |
|---|---|---|
| **Correctness** | 35% | Does it work end-to-end? Are edge cases handled? |
| **Architecture fit** | 30% | Does the new code follow the existing layered patterns? |
| **Code quality** | 25% | Naming, readability, no dead code, proper error handling |
| **Documentation** | 10% | JSDoc, README update, clear commit messages |

---

## Resources

- [Node.js fs/promises](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)
- [Express — query parameters](https://expressjs.com/en/api.html#req.query)
- [React — controlled components](https://react.dev/reference/react-dom/components/input)

---

**Good luck. We value clean, well-considered code over rushed, complete code.**
