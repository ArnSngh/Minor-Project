# Transport Service Operations

The transport service is a separate Node.js service used by the marketplace API. It supports route-match searches against local demo trip fixtures. It does **not** currently have a transporter login, admin screen, trip CRUD endpoints, live routing, booking, or persistent production trip database.

## Run from the repository root

Start the complete application instead:

```powershell
npm.cmd run dev
```

To run this service alone:

```powershell
node transport-service/index.js
```

It listens on port `4100` by default. Set `PORT` to use another port.

## Add or update a demo trip

Demo trip records are stored in [`data/trips.json`](data/trips.json). To add a fixture:

1. Stop the transport service.
2. Add an object to the JSON array. Give it a unique `tripId`; fill in transporter display/contact values, vehicle type/capacity, departure timestamp with timezone, route summary, ordered pickup/drop points, road-distance fixture values, and explanation.
3. Keep `pickupPoint` before `dropPoint` in the trip's travel direction. The current demo matcher uses sample coordinates and simplified direction checks; it is not a map-routing engine.
4. Set `"active": true`. Use `"active": false` to retain a fixture but exclude it from match results. Keep `departAt` in the future; expired trips will not match.
5. Validate JSON syntax and run tests:

   ```powershell
   node -e "JSON.parse(require('node:fs').readFileSync('transport-service/data/trips.json','utf8')); console.log('Trip fixtures are valid JSON')"
   npm.cmd test
   ```

6. Restart the transport service and send a search that fits that fixture's route, radii, capacity, departure, and package limits.

Example shape (use only fake or explicitly consenting demo contact data):

```json
{
  "tripId": "demo-trip-3",
  "transporterName": "Sample transporter 3",
  "transporterPhone": "+91XXXXXXXXXX",
  "vehicleType": "medium_truck",
  "availableCapacityKg": 250,
  "departAt": "2026-11-08T09:00:00+05:30",
  "routeSummary": "Kondagaon to Raipur via a sample stop",
  "pickupPoint": { "name": "Sample pickup", "lat": 19.7, "lng": 81.63 },
  "dropPoint": { "name": "Sample drop", "lat": 21.1, "lng": 81.62 },
  "pickupDistanceKm": 7.0,
  "dropDistanceKm": 8.0,
  "sharedRouteKm": 95,
  "fitStatus": "potential_fit",
  "explanation": "Demo fixture only; confirm details by phone.",
  "active": true
}
```

All points, distances, names, and phone numbers in the example are illustrative. Do not treat them as verified road routes or actual driver information.

## Current trip management limitations

- Editing `data/trips.json` is the only trip administration method in this prototype; restart the service after edits.
- There are no protected admin endpoints or user accounts. Do not expose this service publicly or add real driver's personal data to the repository.
- Trip records are loaded at process startup and are not changed through an API.
- The current matcher uses fixed sample distance/cargo rules, not a road graph. A production route manager needs authentication/authorization, durable storage, availability/update workflows, geocoding/routing provider, road-distance validation, and consent/privacy controls.

## API contract

- `GET /v1/health` returns `{ "status": "ok", "contractVersion": "1" }`.
- `POST /v1/matches` validates the request and returns `{ "matches": [...] }`; a valid request with no candidates returns an empty array.
- Invalid input returns HTTP 400 with a stable `INVALID_INPUT` code.

See the top-level [`TRANSPORT_API_HANDOFF.md`](../TRANSPORT_API_HANDOFF.md) for request/response schemas and integration requirements.
