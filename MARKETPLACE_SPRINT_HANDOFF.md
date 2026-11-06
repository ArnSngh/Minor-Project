# Marketplace Sprint 1 handoff

**Team:** seller engineer (5 hours), buyer engineer (5 hours), transport API teammate (5 hours).
**Demo:** laptop web + Android Expo Go, local APIs, Kondagaon seller fixture, buyers anywhere in India.
**Transport teammate:** receive [TRANSPORT_API_HANDOFF.md](TRANSPORT_API_HANDOFF.md). They own the matching service, not marketplace screens.

## What we will demonstrate

1. Choose English, Hindi, Halbi, or Gondi. Halbi/Gondi wording is provisional until a native speaker reviews it; every visible Sprint 1 label/state still has a translation value.
2. Start as a seeded Kondagaon seller. Stop the marketplace API. Enter one product's title, category, quantity, unit, per-unit price, per-unit estimated weight/dimensions, pickup location, and take/attach one photo. Save the offline draft, restart the app, and see the draft and photo.
3. Restart the API. Sync once; the app uploads the photo and listing without duplicating either on retry. Buyer sees the listing and image.
4. Buyer requests a quantity at the listed price. Seller enters exact quantity, per-unit price, and total; if these equal the buyer's request, seller accepts and available stock decreases. Buyer sees confirmation. Buyer can withdraw **only while pending**. The request page shows the parties' phone contacts after the request, not on a public listing.
5. Buyer or seller opens transport search, reviews/changes the actual load and package details, adjusts `x` and `y` as **road-distance** tolerances, and sees candidate trucks from the friend's service. Each card shows pickup/drop points, road distances, fit status, departure, and transporter phone/call button. No transport booking is needed.

**Not in Sprint 1:** real login, Aadhaar or RTO checks, government authorization, worker OTP/PDF, multi-round counteroffers, notifications, online payments, fulfillment tracking, real transporter onboarding, published web site, APK. Present these as later work, not completed functions. The optional trial SMS alert appears only if it is actually verified live.

## Ownership: code boundaries

| Owner | Files/modules | Must expose to teammate |
|---|---|
| Seller engineer | `frontend/src/app/seller.tsx`, `frontend/src/SellerScreen.tsx`, `frontend/src/draftStore.ts`, `frontend/src/photoStore.*`; listing/photo blocks in `server/index.js` | Listing/photo JSON contract and stable `clientDraftId`/`clientPhotoId` behavior |
| Buyer engineer | `frontend/src/app/buyer.tsx`, `frontend/src/app/transport.tsx`, `frontend/src/BuyerScreen.tsx`, `frontend/src/TransportScreen.tsx`; request/proxy blocks in `server/index.js` | Order status API; transport UI matching the friend contract |
| Transport teammate | `transport-service/*` only | `GET /v1/health`, `POST /v1/matches`, deterministic fixtures and contract tests |

Use one shared Expo app and one marketplace server. Commit the scaffold/types/error shape before independent feature work. The frontend routes are separate. The local Node API currently shares `server/index.js`; coordinate edits there or split owned handlers before parallel backend changes. The Expo app calls **only the marketplace API**. The marketplace API calls the transport service through `TRANSPORT_API_BASE_URL` and exposes `POST /api/transport/matches`. For Android, configure the laptop's LAN address as the marketplace API base; a phone's `localhost` is the phone itself.

## Marketplace API contract to freeze at 0:30

All IDs are opaque strings. Store money in a declared currency/precision; Sprint 1 sample prices are integer rupees. Quantities include a unit (`kg` or `piece`). Timestamps include timezone. API errors use `{ "error": { "code": "STOCK_UNAVAILABLE", "message": "..." } }`; UI maps error **codes** to localized text.

| Endpoint | Sprint 1 behavior |
|---|---|
| `GET /api/health` | `200 {"status":"ok"}` |
| `POST /api/listing-photos` | Upload one image with seller ID and stable `clientPhotoId`; repeat returns the same `photoId` |
| `POST /api/listings` | Create with `photoId` and stable `clientDraftId`; repeat returns the same listing ID |
| `GET /api/listings?q=` | Buyer browse/search; no seller phone in list response |
| `GET /api/listings/:id` | Detail, stock, image and pickup area; no seller phone before request |
| `POST /api/requests` | Create pending fixed-price order request for a quantity |
| `GET /api/requests/:id` | Status and agreed terms; parties' contact details after request |
| `GET /api/sellers/:id/requests` | Seller pending requests |
| `PATCH /api/requests/:id/status` | Accept, decline or buyer-withdraw **from pending only**; acceptance checks and reduces stock atomically |
| `POST /api/transport/matches` | Validate/forward friend's match request; return its response or localized-error code |

Seller acceptance records `exactQuantity`, `unitPriceRupees`, and `totalPriceRupees`, validates arithmetic and stock, then confirms **only if** terms equal the buyer's request. If terms differ, the real product flow requires buyer confirmation of a counteroffer; do not falsely show such a request as confirmed in Sprint 1. Buyer and seller settle payment and fulfillment themselves.

For Sprint 1's local demo, the server may use seeded in-memory state and reset on restart. The **client** draft and photo must survive restart. A later sprint moves server state to a durable hosted database and adds real authentication/authorization; request IDs alone are not suitable access control for a public launch.

## Offline listing contract

The listing form stores draft metadata in Async Storage, plus an image reference. On Android, copy the picker image from a temporary URI into the app document directory before persisting the draft. On web, persist the selected `File`/`Blob` in IndexedDB; an object URL or base64 in Async Storage is insufficient. Use one-photo limit and size/type validation to keep the sprint bounded. Upload photo first, then listing; use stable client IDs on both requests. After a timeout, retry with the **same** IDs. Keep the local draft/photo until the server confirms publication. Show `draft`, `waiting to upload`, `uploading`, `failed—retry`, and `published` states in all four UI languages.

## Five-hour build clock

| Time | Seller engineer | Buyer engineer | Transport teammate |
|---|---|---|---|
| 0:00–0:30 | Scaffold app/server; freeze shared types, locale keys, API shape | Stub buyer/search screens; freeze endpoint shapes | Agree on transport handoff; fixtures |
| 0:30–2:00 | Listing/photo API and form with camera/gallery | Order API and browse/detail/request UI | Match endpoint and fixture routes |
| 2:00–3:30 | Offline photo/draft persistence and sync; seller acceptance UI | Stock-safe accept/withdraw logic; transport search UI/proxy | Direction, road radius, capacity and size filters; tests |
| 3:30–4:20 | Test photo survives restart/API outage and syncs once | Test order lifecycle, phone contact display, match/error cards | Freeze service output; help contract integration |
| 4:20–5:00 | Merge and web/Android demo | Merge and web/Android demo | Run service/contract smoke checks |

Stop feature work at 4:20. The 15 person-hour target is tight, especially offline photos and four-language coverage; report any unmet acceptance check rather than replacing it with a screenshot or claiming a mock is live.

## Shared acceptance checks

- Offline draft and photo survive app restart on Android; web is checked separately. Sync retry creates exactly one listing and photo.
- Buyer sees uploaded photo and correct stock. Seller accepting a request reduces stock once; duplicate acceptance or acceptance after buyer withdrawal fails.
- Buyer and seller phone numbers appear after a request, never on public listing pages. Use fake/consenting fixture numbers only.
- All Sprint 1 screens, statuses and errors render in English, Hindi, Halbi, and Gondi. Mark Halbi/Gondi as **provisional** in the presentation.
- Buyer-side transport search calls the marketplace proxy. It handles matches, no matches, and service failure; it never displays a straight-line value as road distance.
- Test the full story on browser and Android Expo Go on the same LAN. Keep a one-page README with run commands and exact demo limitations.
