# Minor Project

Minor Project is a college prototype of a rural marketplace, piloted with a seller in Kondagaon, Chhattisgarh. It includes an Expo web/Android app and a local Node marketplace API. See the [team handoff](MARKETPLACE_SPRINT_HANDOFF.md) for the sprint scope and the [transport API handoff](TRANSPORT_API_HANDOFF.md) for the teammate-owned matching service.

## Clone, set up, and run

Requires Git and Node.js/npm. Clone the repository, enter the newly cloned project folder, and install frontend dependencies once:

```powershell
git clone https://github.com/ArnSngh/Minor-Project.git
Set-Location minor-project
npm.cmd run setup
```

Start the full local stack (transport API, marketplace API, and Expo web app) with one command:

```powershell
npm.cmd run dev
```

The command works from any machine because the runner resolves service paths relative to the repository; it does not depend on a developer's home-folder path. It starts the services on ports 4100 and 4000 and opens Expo web. Press **Ctrl+C** to stop all three processes.

On macOS/Linux, use `npm run setup` and `npm run dev`. To run the transport service or marketplace backend alone, use the commands in [CONTRIBUTING.md](CONTRIBUTING.md).

For Android Expo Go, install the [Expo Go build matching SDK 58](https://expo.dev/go), connect the phone and computer to the same Wi-Fi, then start the services and Expo in LAN mode:

```powershell
$env:EXPO_PUBLIC_API_URL='http://<computer-LAN-IP>:4000'
npm.cmd run dev:mobile
```

Scan the Expo QR code. A phone cannot reach the computer through `localhost`; use the computer's LAN IP and allow the relevant ports on the private-network firewall if prompted.

The marketplace backend forwards transport requests to the independent service at `TRANSPORT_API_BASE_URL` (defaults to `http://127.0.0.1:4100` in the root dev runner). To connect a teammate's service, set `TRANSPORT_API_BASE_URL` before `npm run dev`. Without a service URL in standalone mode, the marketplace API retains its sample fixture fallback. Fixture phone numbers are fake and cannot be called.

Demo truck trip fixtures are in [`transport-service/data/trips.json`](transport-service/data/trips.json). The service has no driver/admin UI or trip CRUD API; see [the operations guide](transport-service/README.md) for the safe fixture-editing workflow and limitations.

## Team development

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the repository layout, API boundaries, branch workflow, and validation commands. Run the backend suites from the repository root with:

```powershell
npm.cmd test
```

## Seller UI

The seller area now has separate routes: **Dashboard** (`/seller`), **My products** (`/seller/inventory`), **Create listing** (`/seller/new`), **Saved drafts** (`/seller/drafts`), and **Order requests** (`/seller/orders`). The desktop view uses a sidebar; narrow screens use a scrollable navigation row. The dashboard counts and product/order cards come from the local demo API and saved drafts. Amazon Seller Central's dashboard and catalogue navigation informed the layout; branding and workflows are specific to this project.

## Demo sequence

1. Open Seller → **Create listing**. Stop the marketplace API. Fill the three steps and take/choose one photo. Save the draft. Reload the app; the draft and photo should remain under **Saved drafts**.
2. Restart the API. Open **Saved drafts** and press **Upload saved drafts**. Open **My products** to see the published product, then open Buyer and refresh to see the listing and photo there.
3. Buyer requests a quantity. Switch to Seller → **Order requests**, refresh, enter exact quantity, unit price and total, then accept. Switch back to Buyer and refresh the request status.
4. Open Find transport. The default sample route is Kondagaon→Raipur. Change pickup/drop road radius or weight to see match/no-match behavior. When the friend's service is connected, its results replace the sample fixture.

## Demo flow walkthrough

For a guided end-to-end walkthrough, see [DEMO_FLOW_WALKTHROUGH.md](DEMO_FLOW_WALKTHROUGH.md). It covers the exact seller → buyer → transport flow, expected screens, and the commands needed to bring the demo up locally.

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
