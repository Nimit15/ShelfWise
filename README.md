# ShelfWise

**Clinical-Grade Skincare Intelligence**

ShelfWise is a skin analysis and skincare inventory audit application built for the Perfect Corp YouCam API Skin AI & eCommerce VTO Hackathon. It combines the YouCam V2.1 SD Skin Analysis API with a clinical bio-inventory engine to deliver personalized, evidence-based skincare recommendations.

## Architecture

```
src/
├── app/                          # Next.js 15 App Router
│   ├── api/youcam/
│   │   ├── scan/route.ts         # YouCam V2.1 SD API integration
│   │   └── status/route.ts       # Credit balance check
│   ├── globals.css               # Clinical Apothecary design system
│   ├── layout.tsx                # Root layout with font optimization
│   └── page.tsx                  # 5-view state machine
├── components/
│   ├── scan/                     # Views 1-2: Landing & Results
│   ├── audit/                    # Views 3-5: Audit, Product, Verdict
│   └── ui/                       # Theme provider, toast, theme toggle
├── lib/
│   ├── engine/optimizer.ts       # Bio-inventory engine core
│   ├── mock-scan.ts              # Mock scan with all 16 concerns
│   ├── test-helpers.ts           # Default shelf factory
│   └── youcam.ts                 # YouCam V2.1 API client
├── data/catalog.ts               # Apothecary product catalog
├── types/
│   ├── engine.ts                 # Engine types
│   └── youcam.ts                 # YouCam API types
└── styles/clinical-apothecary.css # Design tokens
public/
└── demo-scan/                    # 16 concern mask PNGs
e2e/shelfwise-app.spec.ts        # Playwright E2E tests (7 tests)
```

## Core Features

### YouCam V2.1 SD Skin Analysis API
- 16-concern skin analysis (wrinkle, pore, texture, acne, oiliness, radiance, eye_bag, age_spot, dark_circle_v2, droopy_upper_eyelid, droopy_lower_eyelid, firmness, moisture, redness, tear_trough, skin_type)
- 16-credit endpoint with clinical accuracy
- Mask visualization for each concern
- Ephemeral processing — no selfies are stored

### Bio-Inventory Engine
The `runBioInventoryEngine` performs three layers of analysis:

1. **Scan-to-Shelf Detection**: Compares scan results against products on the user's shelf to detect ingredient conflicts with active skin concerns
2. **Shelf-to-Shelf Detection**: Identifies chemical incompatibilities between products (e.g., retinoids + AHA/BHA, vitamin C + niacinamide)
3. **Redundancy Detection**: Flags duplicate functional roles and recommends consolidation to save cost

### 80+ Ingredient Database
INCI ingredient parsing with active ingredient concentration analysis for:
- Retinoids (retinol, retinaldehyde, tretinoin)
- Antioxidants (vitamin C, vitamin E, ferulic acid)
- Exfoliants (AHA: glycolic, lactic, mandelic; BHA: salicylic)
- Barrier actives (ceramides, hyaluronic acid, niacinamide)
- Sunscreen filters (oxybenzone, avobenzone, zinc oxide)

### Clinical Apothecary Design System
- CSS variable-based design tokens (`--ca-amber`, `--ca-cream`, `--ca-slate`, `--ca-medical`, `--ca-accent-blue/red/green`)
- Typography: Cormorant Garamond (headings), Inter (body), Fira Code (monospace)
- Three judge personas: Clinical (evidence-based), Apothecary (formulation synergy), Minimalist (efficiency-focused)
- Currency toggle: INR/USD with cost-per-day calculations
- Custom theme provider and toast system (zero external dependencies)

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone <repository>
cd shelfwise
npm install
```

### Running the development server
```bash
npm run dev
# Open http://localhost:3000
```

### YouCam API credentials
Place `credentials.json` in `.claude/skills/skin-analysis-expert/`:
```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "license_key": "your_license_key"
}
```
> **Note**: `.env*` and `.claude/skills/**/credentials.json` are gitignored.

### Testing
```bash
# Unit tests (16 tests)
npx vitest run

# End-to-end tests (7 tests)
npx playwright test

# Production build
npm run build
```

## Project Structure

### Engine (`/src/lib/engine/optimizer.ts`)

```typescript
// Key exports
runBioInventoryEngine(scan, shelf, constraints)
getPriorityConcerns(concerns)  // Returns sorted low-score concerns
getStrengths(concerns)          // Returns high-score concerns
BARRIER_CONCERN_THRESHOLDS     // Moisture < 77, Redness > 65, etc.
INCOMPATIBLE_PAIRS             // Retinoid+Exfoliant, VitaminC+Iron, etc.
HIGH_IRRITANCY_ROLES           // Retinoid, Exfoliant, Azelaic
ROLE_PRIORITY                // Clinical prioritization ordering
```

### API Routes (`/src/app/api/youcam/`)

- `POST /api/youcam/scan` — Submits image to YouCam V2.1 SD endpoint
- `GET /api/youcam/status` — Returns credit balance and API health

## License

MIT — Built for the Perfect Corp YouCam API Skin AI & eCommerce VTO Hackathon.
