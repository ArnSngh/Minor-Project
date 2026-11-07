# Demo flow walkthrough

This walkthrough explains the intended local demo flow for the marketplace and transport project. It follows the existing project contract and the working transport integration already wired into the marketplace backend.

## 1. Start the full local demo stack

After cloning the project and opening a terminal in the repository root, install frontend dependencies once and start the entire stack:

```powershell
npm.cmd run setup
npm.cmd run dev
```

On macOS/Linux, use `npm run setup` and `npm run dev`. The root runner resolves each service directory from its own script location, so no developer-specific absolute paths are needed. It starts the marketplace API on port 4000, transport service on port 4100, and Expo web app. Press Ctrl+C to stop the stack.

For the manual, separate-terminal version, see the commands in [CONTRIBUTING.md](CONTRIBUTING.md).

## 2. Seller flow: create a listing and save offline

1. Open the app and switch to the Seller section.
2. Go to Create listing.
3. Fill in the product name, category, quantity, unit, price, weight, and package size.
4. Take or choose a product photo.
5. Save the draft while the API is offline or before upload is complete.
6. Reload the app and confirm the draft remains in Saved drafts.
7. At this stage, the app is demonstrating the offline-first listing workflow.

Expected result:
- the draft stays on-device
- the photo remains associated with the draft
- no duplicate listing is created during retry

## 3. Seller flow: publish the listing

1. Restart the marketplace API if it was stopped earlier.
2. Go to Saved drafts.
3. Press Upload saved drafts.
4. Confirm the draft is uploaded successfully.
5. Go to My products.

Expected result:
- the product appears in the seller inventory
- the photo is now visible to the buyer flow
- the listing is available in the public listing list after refresh

## 4. Buyer flow: browse, request, and review

1. Switch to Buyer.
2. Refresh the listing list.
3. Open the product detail view.
4. Enter a requested quantity.
5. Submit the order request.
6. Switch back to Seller and open Order requests.

Expected result:
- the buyer can see the product and image
- the request is created with a pending state
- the seller sees the buyer contact information only after the request is made

## 5. Seller flow: accept the order

1. Open Order requests from the Seller dashboard.
2. Review the exact quantity, per-unit price, and total.
3. Enter the exact accepted values to match the buyer request.
4. Press Accept.

Expected result:
- the request moves to the accepted state
- stock is reduced only once
- duplicate acceptance is rejected
- the buyer sees updated request status after refresh

## 6. Transport flow: search for a match

1. From the Buyer or Seller flow, open Find transport.
2. The default demo route is Kondagaon → Raipur.
3. Adjust the pickup radius, drop radius, or load weight if needed.
4. Press Find trucks.
5. Review the match cards.

Expected result:
- the app calls the marketplace API
- the marketplace API forwards the request to the transport service
- match cards show route summary, pickup/drop distances, truck capacity, and a contact number
- valid match results appear in a best-first order
- no-match results are shown as a clean empty list when outside the configured route or capacity window

## 7. Expected transport result behavior

For a valid request such as:

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

The marketplace proxy should return a valid match payload from the standalone transport service.

Example outcome:
- one or more truck options are returned
- each result includes trip metadata and route fit information
- the displayed state is "Potential match — confirm by phone"
- no booking or payment flow is shown

## 8. Demo success checklist

The demo is considered successful if all of the following happen:

- seller can save a draft and keep it on-device when the API is down
- seller can upload saved drafts and see the product published
- buyer can discover the listing and submit a request
- seller can accept the request with the exact agreed terms
- buyer can inspect updated request status
- transport search returns a valid truck match for a valid route
- invalid or out-of-range requests return a clean empty or rejected result
- the entire flow is consistent with the transport handoff contract

## 9. Realistic project boundary

This project remains a demo prototype, not a production logistics platform. It intentionally includes:

- in-memory marketplace state
- sample route and transporter data
- fake demo phone numbers
- no real payment, booking, or live tracking

That is the correct scope for this repo, and the demo walkthrough above reflects the intended user-facing flow.
