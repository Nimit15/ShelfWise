# ShelfWise — Engine & API Reference

This guide reflects the current repository structure and implementation. The main application flow is orchestrated by `src/app/page.tsx`; the reusable hook described below is an additional integration helper, not the state owner used by that page.

## 1. Application flow

The current experience moves through:

1. Landing and selfie upload, or a no-upload demo scan.
2. Scan profile and skin-type / sensitivity confirmation.
3. Detailed scan results and dermal-layer visualization.
4. Shelf audit and individual product details.
5. Final routine verdict.

The sample demo is deterministic fixture data. It is not produced by the live YouCam API and is labeled as **Demo fixture** in the interface. Live scan results are labeled **YouCam Live** only after a successful provider response.

## 2. API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/youcam/scan` | Upload a photo and request a live YouCam V2.1 SD or HD scan |
| GET | `/api/youcam/demo` | Return deterministic demo scan and engine output |
| GET | `/api/youcam/status` | Read YouCam credit balance and feature costs (requires API credentials) |
| POST | `/api/engine/audit` | Run the bio-inventory engine on scan, shelf, and constraints |
| POST | `/api/engine/parse-inci` | Parse a custom INCI ingredient list |

### Live scan request

Send a `FormData` body to `POST /api/youcam/scan`:

| Field | Value |
| --- | --- |
| `file` | JPEG or PNG file smaller than 10 MB |
| `tier` | `SD` or `HD` (the current interface requests `HD`) |
| `concerns` | `all` or a comma-separated list valid for the selected tier |
| `enableMaskOverlay` | Optional `true` / `false` |

The route performs server-side format, size, tier, concern, and rate-limit checks. The browser also checks image dimensions before upload. Provider-side validation remains authoritative.

**Provider image requirements:** SD requires a short side of at least 480 px; HD requires at least 1080 px. JPEG and PNG are supported, files must be under 10 MB, and the provider automatically resizes inputs whose long edge exceeds 2560 px. SD and HD concern identifiers cannot be mixed in one task.

A live request returns normalized scan data, the requested tier, concern count, estimated credits used, and a timestamp. If credentials are missing or the provider request fails, the route returns an error; it does not fabricate a YouCam result. Use the demo scan to explore the product without credentials or API credits.

## 3. Score interpretation and skin profile

YouCam `ui_score` values range from 0–100, with **higher values indicating healthier-looking skin**. This direction is used by the concern rankings and the shared skin-profile resolver.

The resolver in `src/lib/engine/skin-type-resolver.ts` considers the returned skin type, oiliness, moisture, redness, and texture. It estimates a profile with skin type, a possible dehydrated-oily sub-condition, sensitivity, barrier status, and a confidence value. The user can confirm or override skin type and sensitivity before the audit.

## 4. Bio-inventory engine

The deterministic rules in `src/lib/engine/optimizer.ts` evaluate:

- **Scan-to-shelf checks:** lower scan scores for barrier-related concerns against products with higher-irritancy roles or product irritancy estimates.
- **Chemical compatibility:** configured active-role pairings and routine-slot overlap.
- **Skin-type and sensitivity fit:** catalog suitability and sensitive-skin flags.
- **Texture-vehicle fit:** compatibility between formulation vehicles in a routine.
- **Redundancy:** multiple products assigned to the same functional role.
- **Routine gaps:** targeted reference formulations, constrained by budget and routine preference.

The engine returns an `EngineOutput` with scan summary, biometric and chemical conflicts, redundancy alerts, gap recommendations, vehicle issues, AM/PM routine steps, a verdict, and an audit trail. These are rule-based decision aids, not clinical guarantees.

## 5. INCI parser

`src/lib/inci-parser.ts` contains the ingredient dictionary and parsing logic. The API accepts:

```json
{
  "inciList": "Water, Glycerin, Niacinamide, Zinc PCA, ...",
  "productName": "Custom serum",
  "createProduct": true
}
```

The response includes parsed ingredients, the first five base ingredients with one-based ranks, inferred functional roles, target concerns, texture vehicle, estimated irritancy, suggested reference pricing, usage time, and an optional product object.

Ingredient names and concentrations may be incomplete or ambiguous in a supplied INCI list. Parser output should be reviewed rather than treated as a verified laboratory formulation.

## 6. Reusable hook

`src/hooks/useShelfWiseEngine.ts` exposes a headless React hook for integrations that want to manage shelf state and constraints independently of the sample page.

It provides `setScan`, shelf add/remove/update actions, constraint setters, profile resolution, `runEngine`, `resetAll`, clinical-summary export, and access to the shared selfie preflight validator. It persists shelf and constraints to browser localStorage under the `shelfwised:` keys. The primary page currently orchestrates its sample flow with page-level React state instead.

## 7. Configuration

Copy `.env.example` to `.env.local` and set:

| Variable | Default | Purpose |
| --- | --- | --- |
| `YOUCAM_API_KEY` | unset | Perfect Corp API credential |
| `YOUCAM_RATE_LIMIT_MAX` | `10` | Requests allowed per IP in the window |
| `YOUCAM_RATE_LIMIT_WINDOW_MS` | `3600000` | Rate-limit window in milliseconds |

The rate limiter is an in-memory, per-process safeguard. Use a shared store for a multi-instance deployment.

## 8. Tests and verification

- `npm test` — Vitest unit tests
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run test:e2e` — Playwright user-flow tests
- `npm run test:visual` — responsive visual checks

The Playwright user-flow tests use the deterministic demo fixture so they do not need a live API key or consume YouCam credits. Live API behavior should be verified separately with a valid credential and a compliant test image.
