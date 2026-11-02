# ShelfWise 

**Clinical-Grade Skincare Intelligence**

ShelfWise is a skin analysis and skincare inventory audit application built for the Perfect Corp YouCam API Skin AI & eCommerce VTO Hackathon. It combines the YouCam V2.1 SD Skin Analysis API with a deterministic clinical bio-inventory engine to deliver personalized, evidence-based skincare recommendations.

## Architecture

The application follows a clean Next.js 16 App Router architecture with a 5-view state machine:

1. **Landing Page** - Selfie upload and demo scan functionality
2. **Results View** - 16-channel biometric telemetry report with 3D dermal stack visualization
3. **Audit View** - Bio-inventory bathroom shelf audit with conflict detection
4. **Product View** - Detailed product information and compatibility analysis
5. **Verdict View** - Clinical decision ledger with actionable recommendations

### Core Components

- **YouCam V2.1 SD API Integration**: 16-concern skin analysis with mask visualization
- **Bio-Inventory Engine**: Three-layer conflict detection system
- **Clinical Apothecary Design System**: CSS variable-based design tokens with professional typography
- **16-Concern Skin Profile**: Comprehensive skin assessment with sensitivity detection

## Key Features

### YouCam V2.1 SD Skin Analysis
- 16 biometric concerns: wrinkle, pore, texture, acne, oiliness, radiance, eye_bag, age_spot, dark_circle_v2, droopy_upper_eyelid, droopy_lower_eyelid, firmness, moisture, redness, tear_trough, skin_type
- Clinical-grade accuracy with mask visualization for each concern
- Ephemeral processing - no selfies are stored

### Bio-Inventory Engine
The engine performs three critical analyses:
1. **Scan-to-Shelf Detection**: Identifies conflicts between scan results and user's shelf products
2. **Shelf-to-Shelf Detection**: Flags chemical incompatibilities between products
3. **Redundancy Detection**: Recommends consolidation of duplicate functional roles

### Clinical Apothecary Design System
- CSS variable-based design tokens (`--ca-amber`, `--ca-cream`, `--ca-slate`, `--ca-medical`, `--ca-accent-blue/red/green`)
- Professional typography: Cormorant Garamond (headings), Inter (body), Fira Code (monospace)
- Three judge personas: Clinical, Apothecary, Minimalist
- Currency toggle with cost-per-day calculations

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
- `runBioInventoryEngine(scan, shelf, constraints)`
- `getPriorityConcerns(concerns)`
- `getStrengths(concerns)`
- `BARRIER_CONCERN_THRESHOLDS`
- `INCOMPATIBLE_PAIRS`
- `HIGH_IRRITANCY_ROLES`
- `ROLE_PRIORITY`

### API Routes (`/src/app/api/youcam/`)
- `POST /api/youcam/scan` - Submits image to YouCam V2.1 SD endpoint
- `GET /api/youcam/status` - Returns credit balance and API health

## Visual Showcase

The application features a professional visual showcase with custom SVGs and live screenshots demonstrating the full user experience:

- `docs/assets/hero-banner.svg` - Editorial header with pipeline visualization
- `docs/assets/system-architecture.svg` - Technical architecture diagram
- `docs/assets/conflict-matrix.svg` - Biometrics × Skin Profile × Shelf Actives matrix
- Live high-DPI screenshots captured with Playwright (1440x900, deviceScaleFactor: 2)

## License

MIT — Built for the Perfect Corp YouCam API Skin AI & eCommerce VTO Hackathon.
