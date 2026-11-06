# Transport service API handoff

**Audience:** teammate implementing the independent transport backend.
**Contract owner:** marketplace team. Agree on this JSON shape before either side codes against it.
**Sprint 1:** seeded sample journeys are acceptable. The marketplace needs truck **discovery**, not booking.

## Marketplace flow

Buyer or seller opens transport search from a listing or order. The screen prefills shipment details from the listing, then lets the user change actual weight, package count, package dimensions, origin, destination, and pickup/drop tolerances. Search may happen before an order is confirmed. Each result displays a potential truck, pickup and drop point, road distances, fit information, planned departure, and the transporter's phone/call button. The seller takes goods to pickup; the buyer collects them at drop. The parties call to agree price and arrangements. No transport inquiry, booking, payment, cancellation, or chat API is required for this integration.

## Required Sprint 1 endpoints

### `GET /v1/health`

Returns `200 { "status": "ok", "contractVersion": "1" }`. Used by the marketplace server and demo smoke check.

### `POST /v1/matches`

Request, using WGS84 coordinates, kilometers, centimeters, kilograms, and ISO 8601 timestamps:

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

All fields above are required for Sprint 1. `pickupRadiusKm` is the maximum **road travel distance from origin to a pickup point on the truck route**; `dropRadiusKm` is the maximum road travel distance **from a later drop point on that route to destination**. The truck must reach pickup before drop in its travel direction. `loadKg` is the entire shipment. Dimensions describe the largest packed parcel; `packageCount` and parcel volume help rule out obvious non-fits. `earliestDepartAt` filters trips departing before the requested time. Validate positive loads, sizes, counts, and nonnegative radii. Return `400` for invalid input.

Response, sorted best first:

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
      "dropPoint": { "name": "Sample drop", "lat": 21.20, "lng": 81.64 },
      "pickupDistanceKm": 7.4,
      "dropDistanceKm": 6.1,
      "sharedRouteKm": 230.0,
      "fitStatus": "potential_fit",
      "explanation": "Pickup and drop are on the selected route in the correct order; confirm loading and availability by phone."
    }
  ]
}
```

The example numbers and labels are illustrative fixtures, not verified road measurements. Real fixture distances should be internally consistent with the sample road graph. `matches: []` is a normal success response. A match may be returned only if `pickupDistanceKm <= pickupRadiusKm`, `dropDistanceKm <= dropRadiusKm`, pickup precedes drop, departure is eligible, reported weight capacity suffices, and the parcel is not an obvious cargo-size non-fit. `fitStatus` does **not** guarantee that several parcels can actually be packed. The phone number is included because the product decision is to let users call the transporter from results; demo fixtures should use an explicitly fake or consenting test number, never an uninvolved person's real number.

Errors use `{ "error": { "code": "INVALID_INPUT", "message": "..." } }`. The marketplace UI localizes by stable `code`, rather than displaying English service error text. Use `503` if the route/match service is unavailable; the marketplace screen shows a localized retry state. The service should not return a successful empty result to hide a backend failure.

## Transporter's future trip-entry interface

Later, the transporter registers a commercial vehicle and enters start, end, and optional via point. The transport service generates route candidates, the transporter selects the actual planned route, and only that selected directed route is searchable. These trip-management endpoints are **owned by the transport teammate** and are not a Sprint 1 integration dependency. The marketplace team only needs to know that `/v1/matches` searches selected trips, not unconfirmed route suggestions.

Google's [Routes API](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes) can generate road routes; alternatives are not returned when an intermediate waypoint is present. Google's [large-vehicle routing](https://developers.google.com/maps/documentation/routes/lvr) currently does not cover India, so ordinary driving routes must not be called truck-safe. The [Google Maps Platform service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) limit storage of Routes API coordinates to 30 days and restrict display with non-Google maps. Provider choice and route-data handling belong to the transport teammate's later implementation plan.

## Integration rules

- Marketplace backend exposes `POST /api/transport/matches` and forwards the request/response to `POST /v1/matches`; the Expo app calls the marketplace backend only. `TRANSPORT_API_BASE_URL` is server configuration. This avoids separate phone LAN/CORS/API-key handling in the app.
- The buyer-side engineer owns the transport search screen and its four-language UI strings. The transport teammate owns only the service contract and fixtures for Sprint 1.
- The marketplace team keeps a deterministic mock response matching this schema until the friend delivers the service. Swap the base URL; do not rewrite the screen.
- Before merge, run contract checks for: correct-order overlap C→D with E→F; reverse direction rejected; pickup outside `x`; drop outside `y`; too much weight; obvious cargo-size non-fit; departure before threshold; no results; service unavailable. Compare **road** distances, not straight-line distances.
- Return no booking status and no claim of guaranteed availability. UI label: **“Potential match — call transporter to confirm.”**
