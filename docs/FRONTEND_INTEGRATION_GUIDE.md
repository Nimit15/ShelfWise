# Frontend Integration Guide — ShelfWise Engine

This guide covers how to integrate the ShelfWise recommendation engine into a React/Next.js frontend. It documents the public API surface, data contracts, and usage patterns for `useShelfWiseEngine`, the YouCam scan pipeline, and persona presets.

---

## 1. Quick Start

```tsx
import { useShelfWiseEngine } from '@/hooks/useShelfWiseEngine';
import { validateSelfiePreflight } from '@/lib/youcam/preflight';

function SkinAnalysisPage() {
  const {
    shelf,
    constraints,
    scanResult,
    isScanning,
    addProduct,
    removeProduct,
    runEngine,
    exportClinicalSummary,
    resetAll,
  } = useShelfWiseEngine();

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

---

## 2. `useShelfWiseEngine` Hook API

### State

| Property | Type | Description |
|----------|------|-------------|
| `shelf` | `ShelfProduct[]` | Current user shelf (persisted to localStorage) |
| `constraints` | `EngineConstraints` | Budget, skin type, avoided ingredients, etc. (persisted) |
| `skinTypeOverride` | `SkinType \| null` | Manual skin type override (persisted) |
| `scanResult` | `EngineInput \| null` | Last YouCam scan result with inferred profile + zone map |
| `engineOutput` | `EngineOutput \| null` | Last engine audit result |
| `isScanning` | `boolean` | YouCam API call in progress |
| `isEngineRunning` | `boolean` | Engine computation in progress |
| `error` | `string \| null` | Last error message |

### Actions — Shelf Management

```ts
// Add a product to shelf (auto-persists)
addProduct(product: ShelfProduct): void

// Remove product by ID (auto-persists)
removeProduct(productId: string): void

// Update product quantity (auto-persists)
updateProduct(productId: string, quantity: number): void

// Clear entire shelf (auto-persists)
clearShelf(): void
```

### Actions — Constraints

```ts
// Set all constraints at once (auto-persists)
setConstraints(constraints: EngineConstraints): void

// Individual setters (each auto-persists)
setBudget(budgetInr: number, budgetUsd?: number): void
setAvoidedIngredients(ingredients: string[]): void
setRoutinePreference(preference: 'minimal' | 'standard' | 'targeted' | 'complete'): void
setCurrency(currency: 'INR' | 'USD'): void
setUserSkinType(skinType: SkinType): void
setUserSensitive(sensitive: boolean): void
```

### Actions — Scan & Engine

```ts
// Validate + scan a selfie file (browser only)
scanSelfie(file: File): Promise<EngineInput | null>

// Run engine with current shelf + constraints + scan
runEngine(): Promise<EngineOutput | null>
```

### Actions — Persistence & Export

```ts
// Wipe ALL localStorage keys (shelf, constraints, skinTypeOverride)
resetAll(): void

// Export clinical summary for sharing/printing
// format: 'json' (default) | 'markdown'
exportClinicalSummary(format?: 'json' | 'markdown'): string
```

---

## 3. Data Contracts (TypeScript)

### ShelfProduct

```ts
interface ShelfProduct {
  id: string;
  name: string;
  brand: string;
  priceInr: number;
  priceUsd: number;
  daysSupply: number;
  roles: FunctionalRole[];
  usageTime: 'AM' | 'PM' | 'BOTH';
  activeIngredients: { name: string; concentration: string }[];
  inciList: string;
  targetConcerns: string[];
  irritancyScore: number; // 0–10
  description: string;
  suitableSkinTypes: SkinType[];
  incompatibleSkinTypes: SkinType[];
  textureVehicle: TextureVehicle;
  safeForSensitive: boolean;
  quantity: number;
}
```

### EngineConstraints

```ts
interface EngineConstraints {
  budgetInr: number;
  budgetUsd: number;
  avoidedIngredients: string[];
  routinePreference: 'minimal' | 'standard' | 'targeted' | 'complete';
  currency: 'INR' | 'USD';
  userSkinType?: SkinType;
  userSensitive?: boolean;
}
```

### EngineOutput (Audit Result)

```ts
interface EngineOutput {
  scanSummary: {
    priorityConcerns: { concern: string; score: number; stars: 1|2|3|4|5 }[];
    strengths: { concern: string; score: number; stars: 1|2|3|4|5 }[];
    skinType: { type: string; region: string };
    skinAge: number;
    overallScore: number;
  };
  biometricConflicts: BiometricConflict[];
  chemicalConflicts: ChemicalConflict[];
  redundancyAlerts: RedundancyAlert[];
  gapRecommendations: GapRecommendation[];
  finalRoutine: { AM: RoutineStep[]; PM: RoutineStep[] };
  verdict: {
    type: 'buy_nothing' | 'targeted_addition' | 'minimal_addition' | 'standard_addition' | 'complete_overhaul';
    totalCostInr: number;
    totalCostUsd: number;
    moneySavedInr: number;
    moneySavedUsd: number;
    message: string;
  };
  auditTrail: {
    productsAnalyzed: number;
    conflictsFound: number;
    redundanciesFound: number;
    gapsIdentified: number;
    productsRecommended: number;
    barrierLoadScore: number;
    compatibilityScore: number;
  };
}
```

### ImpactTelemetry (Money-Saved Summary)

```ts
interface ImpactTelemetry {
  redundantShelfValueSaved: { inr: number; usd: number };
  genericRoutineSavings: { inr: number; usd: number };
  currentShelfCostPerDay: { inr: number; usd: number };
  optimizedCartCostPerDay: { inr: number; usd: number };
  totalConflictsIntercepted: number;
  biometricConflictsIntercepted: number;
  chemicalConflictsIntercepted: number;
  vehicleMismatchesIntercepted: number;
  barrierOverloadIntercepted: number;
  barrierSafetyScore: { before: number; after: number };
  currency: 'INR' | 'USD';
  calculatedAt: string; // ISO timestamp
}
```

### TelemetrySummary (Display-Ready)

```ts
interface TelemetrySummary {
  moneySaved: { inr: number; usd: number };
  conflictsStopped: number;
  barrierImprovement: number; // after - before (0–100)
  routineCostPerDay: { inr: number; usd: number };
}
```

---

## 4. YouCam Scan Pipeline

### Preflight Validation (Client-Side)

```ts
import { validateSelfiePreflight, PreflightResult, ValidatedFile } from '@/lib/youcam/preflight';

const result = await validateSelfiePreflight(file);

if (!result.valid) {
  // Show result.error to user
  return;
}

if (result.warnings.length > 0) {
  // Show warnings (non-blocking)
}

if ('file' in result) {
  // result is ValidatedFile — ready for upload
  const { file, dimensions } = result;
}
```

**Validation Rules:**
- File type: JPEG, PNG, WebP only
- Max size: 10 MB
- Dimensions: 320×320 px minimum, 4096×4096 px maximum
- Warnings for >5 MB files and large dimensions

### Server-Side Scan Endpoint

```ts
// POST /api/youcam/scan
// Body: FormData with 'file' (File)
// Returns: EngineInput (includes scan, skinProfile, zoneMap, activeSkinProfile)

const formData = new FormData();
formData.append('file', file);
const res = await fetch('/api/youcam/scan', { method: 'POST', body: formData });
const engineInput = await res.json();
```

### Demo Mode (No API Key)

```ts
// POST /api/youcam/demo
// Returns: Verified fallback EngineInput (deterministic, no credits used)
const res = await fetch('/api/youcam/demo', { method: 'POST' });
const engineInput = await res.json();
```

---

## 5. Persona Presets (Testing & Demo)

```ts
import { 
  PERSONAS, 
  getPersona, 
  getAllPersonas, 
  buildPersonaShelf, 
  buildPersonaConstraints,
  getPersonaSummary 
} from '@/lib/engine/personas';
import { catalog } from '@/data/catalog';

// List all personas
const all = getAllPersonas();
// [{ id, title, subtitle, budgetDisplay, productCount }, ...]

// Get single persona
const persona = getPersona('student_overexfoliated');

// Build shelf from catalog
const shelf = buildPersonaShelf('student_overexfoliated', catalog);

// Build engine constraints
const constraints = buildPersonaConstraints('student_overexfoliated');

// Apply to hook
setConstraints(constraints);
shelf.forEach(p => addProduct(p));
```

**Available Personas:**
| ID | Title | Products | Budget | Expected Verdict |
|----|-------|----------|--------|------------------|
| `student_overexfoliated` | The Over-Exfoliating Student | 6 | ₹1,500 / $18 | `targeted_addition` |
| `influencer_clutter` | The 7-Step Influencer Haul | 10 | ₹5,000 / $60 | `minimal_addition` |
| `minimalist_complete` | The Balanced Minimalist | 4 | ₹3,500 / $45 | `buy_nothing` |

---

## 6. localStorage Persistence

Keys used (all prefixed with `shelfwised:`):

| Key | Content | Updated By |
|-----|---------|------------|
| `shelfwised:shelf` | `ShelfProduct[]` | `addProduct`, `removeProduct`, `updateProduct`, `clearShelf` |
| `shelfwised:constraints` | `EngineConstraints` | `setConstraints`, `setBudget`, `setAvoidedIngredients`, `setRoutinePreference`, `setCurrency`, `setUserSkinType`, `setUserSensitive` |
| `shelfwised:skinTypeOverride` | `SkinType \| null` | `setUserSkinType` |

**Hydration:** On mount, the hook reads all three keys client-side (`typeof window !== 'undefined'`). SSR renders with empty state; client hydrates on first render.

**Reset:** `resetAll()` deletes all three keys and resets hook state to defaults.

---

## 7. Clinical Summary Export

```ts
// JSON format (machine-readable)
const json = exportClinicalSummary('json');
// {
//   "generatedAt": "2026-...",
//   "scanSummary": { ... },
//   "engineOutput": { ... },
//   "telemetry": { ... }
// }

// Markdown format (human-readable, printable)
const md = exportClinicalSummary('markdown');
// # ShelfWise Clinical Summary
// **Generated:** ...
// ## Scan Summary
// ...
```

---

## 8. API Routes Reference

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/youcam/scan` | POST | None | Upload selfie, returns `EngineInput` |
| `/api/youcam/demo` | POST | None | Deterministic fallback `EngineInput` |
| `/api/youcam/status` | GET | None | Credit balance + rate limit status |
| `/api/engine/audit` | POST | None | Run engine with shelf + constraints + scan |
| `/api/engine/parse-inci` | POST | None | Parse INCI list to structured ingredients |

---

## 9. Error Handling Patterns

```ts
const { error, isScanning, isEngineRunning } = useShelfWiseEngine();

// Scan errors
try {
  await scanSelfie(file);
} catch (e) {
  // Network errors, API errors caught internally → sets `error` state
}

// Engine errors
try {
  await runEngine();
} catch (e) {
  // Validation errors, computation errors → sets `error` state
}

// Always check error state in UI
if (error) {
  return <Alert>{error}</Alert>;
}
```

---

## 10. Rate Limiting (Client Awareness)

```ts
// GET /api/youcam/status
// Returns:
{
  "creditsRemaining": 1234,
  "rateLimit": {
    "allowed": true,
    "remaining": 8,
    "resetAt": 1700000000000 // epoch ms
  }
}
```

- Default: 10 uncached scans/IP/hour
- Configured via `YOUCAM_RATE_LIMIT_MAX` and `YOUCAM_RATE_LIMIT_WINDOW_MS` env vars
- Check `status` before scan to show user remaining quota

---

## 11. Skin Type & Scoring Reference

### Skin Types
`normal` | `oily` | `dry` | `combination` | `dehydrated_oily`

### Sensitive Auto-Inference
- `redness` ui_score < 65 → sensitive = true
- `moisture` ui_score < 58 → sensitive = true

### Star Thresholds (ui_score)
| Stars | Range |
|-------|-------|
| 5 | ≥ 85 |
| 4 | 70–84 |
| 3 | 55–69 |
| 2 | 40–54 |
| 1 | < 40 |

### Concern Categories (16 HD / 16 SD)
`hd_wrinkle`, `hd_pore`, `hd_texture`, `hd_acne`, `hd_oiliness`, `hd_radiance`, `hd_eye_bag`, `hd_age_spot`, `hd_dark_circle`, `hd_droopy_upper_eyelid`, `hd_droopy_lower_eyelid`, `hd_firmness`, `hd_moisture`, `hd_redness`, `hd_tear_trough`, `hd_skin_type`

---

## 12. Functional Roles (10)

`cleanser`, `hydrator`, `exfoliant_aha_bha`, `retinoid`, `antioxidant_vit_c`, `sunscreen_spf`, `barrier_repair`, `brightening`, `acne_treatment`, `eye_care`

---

## 13. Texture Vehicles (8)

`cream_cleanser`, `gel_cleanser`, `oil_cleanser`, `light_fluid`, `gel_cream`, `rich_cream`, `balm_ointment`, `powder`

---

## 14. Testing Utilities

```ts
// In tests, import validators directly
import { validateSelfiePreflight } from '@/lib/youcam/preflight';
import { calculateImpactTelemetry, summarizeTelemetry } from '@/lib/engine/telemetry';
import { buildPersonaShelf, buildPersonaConstraints } from '@/lib/engine/personas';

// Mock shelf for telemetry tests
const shelf = createMockShelfWithExtraHydrator();
const output = createMockEngineOutput();
const constraints = createMockConstraints();

const telemetry = calculateImpactTelemetry(output, shelf, constraints);
const summary = summarizeTelemetry(telemetry);
```

---

## 15. Common Patterns

### Pattern: Scan → Engine → Display

```tsx
function AnalysisFlow() {
  const { scanSelfie, runEngine, scanResult, engineOutput, isScanning, isEngineRunning } = useShelfWiseEngine();

  const handleScan = async (file: File) => {
    const input = await scanSelfie(file);
    if (input) {
      await runEngine();
    }
  };

  return (
    <div>
      {isScanning && <Spinner />}
      {isEngineRunning && <Spinner />}
      {scanResult && <ScanSummary data={scanResult.scanSummary} />}
      {engineOutput && <AuditResult data={engineOutput} />}
    </div>
  );
}
```

### Pattern: Persona Demo Mode

```tsx
function DemoSelector() {
  const { setConstraints, clearShelf, addProduct } = useShelfWiseEngine();
  const personas = getAllPersonas();

  const loadPersona = (id: string) => {
    clearShelf();
    const constraints = buildPersonaConstraints(id);
    setConstraints(constraints);
    const shelf = buildPersonaShelf(id, catalog);
    shelf.forEach(p => addProduct(p));
  };

  return (
    <select onChange={e => loadPersona(e.target.value)}>
      <option value="">Select persona...</option>
      {personas.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
  );
}
```

### Pattern: Export & Share

```tsx
function ExportButton() {
  const { exportClinicalSummary, engineOutput } = useShelfWiseEngine();

  const handleExport = (format: 'json' | 'markdown') => {
    const content = exportClinicalSummary(format);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelfwised-summary-${Date.now()}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button onClick={() => handleExport('json')}>Export JSON</button>
      <button onClick={() => handleExport('markdown')}>Export Markdown</button>
    </>
  );
}
```

---

## 16. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `YOUCAM_API_KEY` | — | Required for live scans |
| `YOUCAM_RATE_LIMIT_MAX` | `10` | Max scans per IP per window |
| `YOUCAM_RATE_LIMIT_WINDOW_MS` | `3600000` | Rate limit window (1 hour) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Base URL for API calls |

---

## 17. Version Compatibility

| Package | Version |
|---------|---------|
| Next.js | 16.4.2 |
| React | 19.3.0 |
| TypeScript | 5.x |
| Zod | 4.6.7 |
| Vitest | 2.x |

---

## 18. Changelog

### v1.0.0 (Current)
- `useShelfWiseEngine` with full localStorage persistence
- `resetAll()` for complete state wipe
- `exportClinicalSummary()` in JSON and Markdown
- `validateSelfiePreflight` exposed from hook
- 3 persona presets with catalog mapping
- Impact telemetry (money saved, conflicts intercepted, barrier safety)
- YouCam preflight validation (type, size, dimensions)
- Demo mode fallback (deterministic, no API key)
- 129 tests passing (preflight, personas, telemetry, engine)