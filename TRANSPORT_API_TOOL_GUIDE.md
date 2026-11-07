# Transport API Tool Guide

## 1. Project context

This project is a rural marketplace demo for Chhattisgarh. It uses a React Native Expo frontend and a Node.js marketplace backend. The transport tool is a separate service that finds truck matches for goods moving from a seller's pickup point to a buyer's destination.

The transport tool is not a booking system. It is a discovery service that returns potential matching trips and lets the buyer or seller call the transporter to confirm availability.

## 2. What this tool does

The transport API handles:

- health checks
- shipment search requests
- route validation
- capacity and cargo-fit filtering
- road-distance match logic
- deterministic sample results for demo use
- no-match and unavailable service handling

It matches the Sprint 1 API contract described in `TRANSPORT_API_HANDOFF.md`.

## 3. API contract

### Health

Request:

```http
GET /v1/health
```

Response:

```json
{
  "status": "ok",
  "contractVersion": "1"
}
```

### Match request

Request:

```http
POST /v1/matches
```

Body:

```json
{
  "origin": { "lat": 19.5939, "lng": 81.6689 },
  "destination": { "lat": 21.2514, "lng": 81.6296 },
  "pickupRadiusKm": 10,
  "dropRadiusKm": 10,
  "loadKg": 100,
  "packageCount": 1,
  "packageLengthCm": 80,
  "packageWidthCm": 60,
  "packageHeightCm": 50,
  "earliestDepartAt": "2026-11-07T00:00:00+05:30"
}
```

### Match response

```json
{
  "matches": [
    {
      "tripId": "demo-trip-1",
      "transporterName": "Sample transporter",
      "transporterPhone": "+91XXXXXXXXXX",
      "vehicleType": "medium_truck",
      "availableCapacityKg": 300,
      "departAt": "2026-11-07T09:00:00+05:30",
      "routeSummary": "Kondagaon to Raipur via Kanker",
      "pickupPoint": { "name": "Sample pickup", "lat": 19.65, "lng": 81.66 },
      "dropPoint": { "name": "Sample drop", "lat": 21.2, "lng": 81.64 },
      "pickupDistanceKm": 7.4,
      "dropDistanceKm": 6.1,
      "sharedRouteKm": 230,
      "fitStatus": "potential_fit",
      "explanation": "Pickup and drop are on the selected route in the correct order; confirm loading and availability by phone."
    }
  ]
}
```

## 4. Where this tool lives in the project

- Transport service: `transport-service/index.js`
- Service tests: `transport-service/index.test.js`
- Marketplace proxy: `server/index.js`
- Frontend transport screen: `frontend/src/TransportScreen.tsx`
- Frontend API wrapper: `frontend/src/api.ts`

## 5. Integration with the marketplace backend

The marketplace server exposes a proxy endpoint:

```http
POST /api/transport/matches
```

The server checks for `TRANSPORT_API_BASE_URL` and then calls:

```http
POST http://<transport-service-host>:4100/v1/matches
```

If the environment variable is absent, the marketplace API falls back to a deterministic local mock response. This helps demo work and lets the frontend remain unchanged while the actual service is swapped in later.

Example:

```powershell
cd server
$env:TRANSPORT_API_BASE_URL='http://localhost:4100'
node index.js
```

## 6. Running the full project

```powershell
cd <cloned-project-folder>
npm.cmd run setup
npm.cmd run dev
```

Run `npm run setup` and `npm run dev` on macOS/Linux. The root development runner starts the transport service, marketplace API, and frontend together. It resolves paths relative to the repository rather than a fixed user directory.

To run only the transport service, open a terminal in the repository root and run:

```powershell
node transport-service/index.js
```

## 7. Running the transport demo request

With the transport service running, run from the repository root:

```powershell
node transport-service/demo.js
```

This calls the health endpoint and a sample match search, then saves the result to `transport-service/demo-output.json` (ignored by Git).

## 8. Integrating a separate transport service

When running only the marketplace backend, configure its URL and start it from the repository root:

```powershell
$env:TRANSPORT_API_BASE_URL='http://localhost:4100'
node server/index.js
```

Then call the marketplace proxy endpoint:

```powershell
curl -X POST http://localhost:4000/api/transport/matches \
  -H "Content-Type: application/json" \
  -d '{
    "origin":{"lat":19.5939,"lng":81.6689},
    "destination":{"lat":21.2514,"lng":81.6296},
    "pickupRadiusKm":10,
    "dropRadiusKm":10,
    "loadKg":100,
    "packageCount":1,
    "packageLengthCm":80,
    "packageWidthCm":60,
    "packageHeightCm":50,
    "earliestDepartAt":"2026-11-07T00:00:00+05:30"
  }'
```

## 9. Frontend behavior

The frontend transport screen uses the marketplace API endpoint, not the transport service directly. It sends the route request and renders the results. The UI can show multiple vehicle options, a road-distance summary, and a call button to the transporter.

The app’s transport screen is already using the expected pattern through `frontend/src/api.ts` and `frontend/src/TransportScreen.tsx`.

## 10. Validation rules to keep in place

The service must reject or handle the following cases:

- valid route order with a fit → `matches: [...]`
- reverse route → empty result or invalid route
- pickup outside radius → no match
- drop outside radius → no match
- weight above capacity → no match
- obvious cargo-size mismatch → no match
- departure before threshold → no match
- service outage → `503` and an error object

## 11. Demo flow summary

1. Start the transport service.
2. Start the marketplace server with `TRANSPORT_API_BASE_URL` configured.
3. Open the frontend transport search screen.
4. Fill shipment details and choose the route.
5. Press Find Trucks.
6. The app calls the marketplace proxy.
7. The marketplace server forwards the request to the transport service.
8. The result card shows vehicle, route, road distances, and phone number.
9. The user can call the transporter to confirm availability.

## 12. One-click local startup

A project-level PowerShell launcher is included so the demo stack can be started with one command:

```powershell
cd "c:\Users\Aryan Singh\OneDrive\Desktop\minor project\minor-project"
./start-transport-demo.ps1
```

This script starts:

- the transport service on port 4100
- the marketplace API on port 4000
- a test match request against the full proxy chain

## 13. Best practice for later production

This is still a demo-grade implementation. In a real deployment, the transport teammate would replace the seeded sample route logic with real route calculations, verified vendor data, and a proper trip database. The marketplace API contract remains the same, so the UI and app logic can continue to function without change.
