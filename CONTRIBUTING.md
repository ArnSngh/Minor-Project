# Team contribution guide

This repository is a local demo of a rural marketplace. It is organized so teammates can work on the Expo app, marketplace API, and transport matching service independently while keeping the agreed API boundary stable.

## Get the project

```powershell
git clone https://github.com/ArnSngh/Minor-Project.git
Set-Location minor-project
npm.cmd run setup
```

The setup command installs the frontend dependencies. The Node backend services use built-in Node modules and need no third-party install. On macOS/Linux, use `npm run setup`.

## Start the project

```powershell
npm.cmd run dev
```

This starts the transport service, marketplace API, and Expo web client together. Use `npm run dev` on macOS/Linux. Press Ctrl+C to stop the processes.

To start Expo for a phone on the same Wi-Fi network, set the API URL to the computer's LAN address before starting:

```powershell
$env:EXPO_PUBLIC_API_URL='http://<computer-LAN-IP>:4000'
npm.cmd run dev:mobile
```

The app must call the marketplace API. Do not have the frontend call the transport service directly.

## Repository map

| Area | Location | Responsibility |
|---|---|---|
| Expo frontend | `frontend/src/` | Seller, buyer, and transport screens; locale strings; API client |
| Marketplace backend | `server/index.js` | Listings, photos, order requests, and transport API proxy |
| Transport service | `transport-service/` | Independent health and trip-match endpoints with demo fixtures |
| Root scripts | `scripts/` | Install frontend dependencies, run the stack, and run backend tests |
| Product/contract docs | root `*.md` | Scope, acceptance criteria, API handoffs, and demo procedures |

## Service and API boundaries

- The frontend sends marketplace requests to `EXPO_PUBLIC_API_URL` (default `http://localhost:4000`).
- The marketplace server exposes `POST /api/transport/matches` and forwards to `${TRANSPORT_API_BASE_URL}/v1/matches`.
- The transport service defaults to port `4100`; its `GET /v1/health` and `POST /v1/matches` contract is documented in [TRANSPORT_API_HANDOFF.md](TRANSPORT_API_HANDOFF.md).
- Transport demo fixtures live in `transport-service/data/trips.json`; follow [the transport operations guide](transport-service/README.md) to add/edit/disable sample trips. This is not a real driver-management interface.
- Keep stable response and error shapes when changing a contract. Update the caller, tests, and handoff documentation in the same change.
- Demo data is intentionally seeded. Do not present sample route distances or sample phone numbers as live/verified information.

## Typical team workflow

1. Pull the latest default branch and create a focused feature branch:
   ```sh
   git switch main
   git pull
   git switch -c feature/short-description
   ```
2. Own the relevant area and coordinate before changing shared API contracts or `server/index.js`.
3. Keep changes focused; add/update tests and documentation when behavior or contracts change.
4. Run checks from the repository root:
   ```powershell
   npm.cmd test
   Set-Location frontend
   npm.cmd run lint
   npx.cmd tsc --noEmit
   ```
   Also run `npx.cmd expo export --platform web` when frontend routing, Expo config, or cross-platform behavior changes.
5. Review `git status`, commit only intended files, push the branch, and open a pull request for team review.

Use `npm test`, `npm run lint`, and `npx tsc --noEmit` on macOS/Linux (from the appropriate root or frontend directory).

## Known demo boundaries

- Marketplace data is in memory and resets when its server restarts.
- Seller, product, transporter, and route records are demo fixtures.
- Authentication, authorization, payment, booking, and delivery tracking are not implemented.
- The local API is not hardened for public deployment.

These are scope limitations of the prototype, not failures to hide. Production deployment needs separate security, persistence, routing-provider, and operational work.
