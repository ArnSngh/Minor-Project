# Minor Project

Minor Project is a college prototype of a rural marketplace, piloted with a seller in Kondagaon, Chhattisgarh. It includes an Expo web/Android app and a local Node marketplace API. See the [team handoff](MARKETPLACE_SPRINT_HANDOFF.md) for the sprint scope and the [transport API handoff](TRANSPORT_API_HANDOFF.md) for the teammate-owned matching service.

## Run locally

Requires Node.js and npm. Use two terminals:

```powershell
cd server
npm start
```

```powershell
cd frontend
$env:EXPO_PUBLIC_API_URL='http://localhost:4000'
npm run web
```

For Android Expo Go, install the [Expo Go build matching SDK 58](https://expo.dev/go) on the phone, then put the laptop and phone on the same Wi-Fi. Set `EXPO_PUBLIC_API_URL` to `http://<laptop-LAN-IP>:4000` before `npm start` in `frontend`, then scan Expo's QR code. A phone cannot reach the laptop API through `localhost`. The API listens on port 4000 by default; set `PORT` to change it. A local firewall may need to allow that port on the private network.

To use the friend's service, set `TRANSPORT_API_BASE_URL` in the **server** terminal, such as `http://localhost:4100`, before `npm start`. The frontend still calls only port 4000. Without this variable, the API returns one explicitly labeled sample transport match for the Kondagaon→Raipur fixture. The sample transporter number is fake and cannot be called.

## Seller UI

The seller area now has separate routes: **Dashboard** (`/seller`), **My products** (`/seller/inventory`), **Create listing** (`/seller/new`), **Saved drafts** (`/seller/drafts`), and **Order requests** (`/seller/orders`). The desktop view uses a sidebar; narrow screens use a scrollable navigation row. The dashboard counts and product/order cards come from the local demo API and saved drafts. Amazon Seller Central's dashboard and catalogue navigation informed the layout; branding and workflows are specific to this project.

## Demo sequence

1. Open Seller → **Create listing**. Stop the marketplace API. Fill the three steps and take/choose one photo. Save the draft. Reload the app; the draft and photo should remain under **Saved drafts**.
2. Restart the API. Open **Saved drafts** and press **Upload saved drafts**. Open **My products** to see the published product, then open Buyer and refresh to see the listing and photo there.
3. Buyer requests a quantity. Switch to Seller → **Order requests**, refresh, enter exact quantity, unit price and total, then accept. Switch back to Buyer and refresh the request status.
4. Open Find transport. The default sample route is Kondagaon→Raipur. Change pickup/drop road radius or weight to see match/no-match behavior. When the friend's service is connected, its results replace the sample fixture.

## Validation

```powershell
cd server
npm test
```

```powershell
cd frontend
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

The API test covers idempotent photo/listing uploads, buyer withdrawal, duplicate acceptance, and stock reduction.

## Current boundaries

- This is a **local demo**, not a deployed marketplace. Server state is in memory and resets on restart. Device-side drafts persist separately. The Android and browser interaction flow still needs a live device/browser check; CLI typecheck, lint, export, and API tests do not prove it works on a phone.
- The seller and trip are fixtures. There is no real login, field-worker authorization, Aadhaar verification, RTO lookup, payment, booking, or delivery tracking.
- English and Hindi main UI labels are present. Server error text and some fixture text still appear in English. Halbi and Gondi options currently display **provisional Hindi fallback with an explicit warning**; native-speaker translations are required before a real pilot. Do not present them as completed translations.
- Transport search uses sample coordinates and a sample result until the independent service is connected. Its phone number is intentionally fake. Do not describe the fixture distances as live routing measurements.
- The local API uses permissive CORS and no authorization for demo work. Do not deploy it publicly in this state.
